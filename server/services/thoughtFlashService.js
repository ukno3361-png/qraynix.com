/**
 * server/services/thoughtFlashService.js
 * CRUD and feed operations for random thought flash items.
 */

const { getDb } = require('../db');

const inferMediaTypeFromUrl = (url) => {
    const raw = String(url || '').toLowerCase().split('?')[0].split('#')[0];
    if (raw.endsWith('.mp4') || raw.endsWith('.webm') || raw.endsWith('.mov')) return 'mp4';
    if (raw.endsWith('.gif')) return 'gif';
    return 'image';
};

const normalizeMediaType = (value, mediaUrl) => {
    const type = String(value || '').toLowerCase();
    if (type === 'gif' || type === 'mp4' || type === 'image') return type;
    return inferMediaTypeFromUrl(mediaUrl);
};

const createThoughtFlashService = () => {
    const list = ({ includeHidden = false, offset = 0, limit = 12 } = {}) => {
        const db = getDb();
        const where = includeHidden ? '' : 'WHERE visible = 1';
        return db.prepare(`
            SELECT *
            FROM thought_flashes
            ${where}
            ORDER BY sort_order ASC, updated_at DESC, id DESC
            LIMIT ? OFFSET ?
        `).all(limit, offset);
    };

    const countVisible = () => {
        const db = getDb();
        const row = db.prepare('SELECT COUNT(*) as total FROM thought_flashes WHERE visible = 1').get();
        return row?.total || 0;
    };

    const getById = (id) => {
        const db = getDb();
        return db.prepare('SELECT * FROM thought_flashes WHERE id = ?').get(id) || null;
    };

    const create = (data = {}) => {
        const db = getDb();
        const result = db.prepare(`
            INSERT INTO thought_flashes
                (media_url, media_type, preview_text, thought_text, sort_order, visible)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            String(data.media_url || '').trim(),
            normalizeMediaType(data.media_type, data.media_url),
            String(data.preview_text || '').trim() || 'Untitled thought',
            String(data.thought_text || '').trim() || 'No thought text yet.',
            Number.isFinite(Number(data.sort_order)) ? Number(data.sort_order) : 0,
            data.visible === false ? 0 : 1
        );

        return getById(result.lastInsertRowid);
    };

    const update = (id, patch = {}) => {
        const db = getDb();
        const allowed = ['media_url', 'media_type', 'preview_text', 'thought_text', 'sort_order', 'visible'];
        const updates = Object.entries(patch).filter(([key]) => allowed.includes(key));
        if (updates.length === 0) return getById(id);

        const normalized = updates.map(([key, value]) => {
            if (key === 'media_type') return [key, normalizeMediaType(value, patch.media_url)];
            if (key === 'visible') return [key, value ? 1 : 0];
            return [key, value];
        });

        if (!patch.media_type && patch.media_url) {
            normalized.push(['media_type', inferMediaTypeFromUrl(patch.media_url)]);
        }

        const setClause = normalized.map(([key]) => `${key} = ?`).join(', ');
        db.prepare(`
            UPDATE thought_flashes
            SET ${setClause}, updated_at = datetime('now')
            WHERE id = ?
        `).run(...normalized.map(([, value]) => value), id);

        return getById(id);
    };

    const remove = (id) => {
        const db = getDb();
        db.prepare('DELETE FROM thought_flashes WHERE id = ?').run(id);
    };

    const reorder = (items) => {
        const db = getDb();
        const tx = db.transaction(() => {
            const stmt = db.prepare('UPDATE thought_flashes SET sort_order = ?, updated_at = datetime(\'now\') WHERE id = ?');
            (items || []).forEach(({ id, sort_order }) => {
                stmt.run(sort_order, id);
            });
        });
        tx();
    };

    return { list, countVisible, getById, create, update, remove, reorder };
};

module.exports = { createThoughtFlashService };
