/**
 * server/services/entryService.js
 * Business logic for journal entries.
 * Handles CRUD, publishing, versioning, and word count.
 */

const { getDb } = require('../db');
const { slugify } = require('../utils/slugify');
const { paginate } = require('../utils/paginate');

/**
 * countWords — counts words in a text string.
 * @param {string} text
 * @returns {number}
 */
const countWords = (text) => {
    if (!text) return 0;
    // Strip HTML/JSON markup for word counting
    const clean = text.replace(/<[^>]*>/g, '').replace(/[{}[\]":,]/g, ' ');
    return clean.split(/\s+/).filter(Boolean).length;
};

/**
 * estimateReadTime — minutes to read based on 200 WPM.
 * @param {number} wordCount
 * @returns {number}
 */
const estimateReadTime = (wordCount) => Math.max(1, Math.ceil(wordCount / 200));

/**
 * createEntryService — factory for entry operations.
 * @returns {Object}
 */
const createEntryService = () => {
    const create = ({ title, content = '', content_html = '', excerpt = '', status = 'draft', ...rest }) => {
        const db = getDb();
        let slug = slugify(title);

        // Ensure unique slug
        const existing = db.prepare('SELECT id FROM entries WHERE slug = ?').get(slug);
        if (existing) slug = `${slug}-${Date.now()}`;

        const wc = countWords(content);
        const rt = estimateReadTime(wc);

        const result = db.prepare(`
      INSERT INTO entries (title, slug, content, content_html, excerpt, status,
        cover_image, featured, mood, location, weather, word_count, read_time, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            title, slug, content, content_html, excerpt, status,
            rest.cover_image || null, rest.featured ? 1 : 0,
            rest.mood || null, rest.location || null, rest.weather || null,
            wc, rt, status === 'published' ? new Date().toISOString() : null
        );

        return getById(result.lastInsertRowid);
    };

    const getById = (id) => {
        const db = getDb();
        const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(id);
        if (!entry) return null;

        // Attach tags
        entry.tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN entry_tags et ON et.tag_id = t.id
      WHERE et.entry_id = ?
    `).all(id);

        return entry;
    };

    const getBySlug = (slug) => {
        const db = getDb();
        const entry = db.prepare('SELECT * FROM entries WHERE slug = ?').get(slug);
        if (!entry) return null;

        entry.tags = db.prepare(`
      SELECT t.* FROM tags t
      JOIN entry_tags et ON et.tag_id = t.id
      WHERE et.entry_id = ?
    `).all(entry.id);

        return entry;
    };

    const list = ({ status, tag, page = 1, limit = 10, search, featured } = {}) => {
        const db = getDb();
        let where = [];
        let params = [];

        if (status) { where.push('e.status = ?'); params.push(status); }
        if (featured) { where.push('e.featured = 1'); }
        if (tag) {
            where.push('e.id IN (SELECT entry_id FROM entry_tags et JOIN tags t ON t.id = et.tag_id WHERE t.slug = ?)');
            params.push(tag);
        }
        if (search) {
            where.push('e.id IN (SELECT rowid FROM entries_fts WHERE entries_fts MATCH ?)');
            params.push(search);
        }

        const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

        const total = db.prepare(`SELECT COUNT(*) as c FROM entries e ${whereClause}`).get(...params).c;
        const pag = paginate(total, page, limit);

        const entries = db.prepare(`
      SELECT e.* FROM entries e ${whereClause}
      ORDER BY e.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, pag.perPage, pag.offset);

        // Attach tags to each entry
        const tagStmt = db.prepare(`
      SELECT t.* FROM tags t JOIN entry_tags et ON et.tag_id = t.id WHERE et.entry_id = ?
    `);
        entries.forEach((e) => { e.tags = tagStmt.all(e.id); });

        return { entries, pagination: pag };
    };

    const update = (id, patch) => {
        const db = getDb();
        const allowed = [
            'title', 'content', 'content_html', 'excerpt', 'status',
            'cover_image', 'featured', 'mood', 'location', 'weather',
        ];
        const updates = Object.entries(patch).filter(([k]) => allowed.includes(k));

        if (updates.length === 0) return getById(id);

        // Recalculate word count if content changed
        if (patch.content !== undefined) {
            const wc = countWords(patch.content);
            updates.push(['word_count', wc]);
            updates.push(['read_time', estimateReadTime(wc)]);
        }

        // Auto-set published_at when publishing
        if (patch.status === 'published') {
            const existing = db.prepare('SELECT published_at FROM entries WHERE id = ?').get(id);
            if (!existing?.published_at) {
                updates.push(['published_at', new Date().toISOString()]);
            }
        }

        const setClause = updates.map(([k]) => `${k} = ?`).join(', ');
        const values = updates.map(([, v]) => v);

        db.prepare(`UPDATE entries SET ${setClause}, updated_at = datetime('now') WHERE id = ?`)
            .run(...values, id);

        // Save version snapshot
        if (patch.content !== undefined) {
            db.prepare('INSERT INTO entry_versions (entry_id, content, word_count) VALUES (?, ?, ?)')
                .run(id, patch.content, countWords(patch.content));
        }

        return getById(id);
    };

    const remove = (id) => {
        const db = getDb();
        db.prepare('DELETE FROM entries WHERE id = ?').run(id);
    };

    const updateTags = (entryId, tagIds) => {
        const db = getDb();
        const tx = db.transaction(() => {
            db.prepare('DELETE FROM entry_tags WHERE entry_id = ?').run(entryId);
            const ins = db.prepare('INSERT INTO entry_tags (entry_id, tag_id) VALUES (?, ?)');
            tagIds.forEach((tid) => ins.run(entryId, tid));
        });
        tx();
    };

    const getVersions = (entryId) => {
        const db = getDb();
        return db.prepare(
            'SELECT id, word_count, created_at FROM entry_versions WHERE entry_id = ? ORDER BY created_at DESC'
        ).all(entryId);
    };

    const getStats = () => {
        const db = getDb();
        return {
            totalEntries: db.prepare('SELECT COUNT(*) as c FROM entries').get().c,
            totalWords: db.prepare('SELECT COALESCE(SUM(word_count), 0) as c FROM entries').get().c,
            published: db.prepare("SELECT COUNT(*) as c FROM entries WHERE status = 'published'").get().c,
            drafts: db.prepare("SELECT COUNT(*) as c FROM entries WHERE status = 'draft'").get().c,
        };
    };

    return { create, getById, getBySlug, list, update, remove, updateTags, getVersions, getStats };
};

module.exports = { createEntryService, countWords, estimateReadTime };
