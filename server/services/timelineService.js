/**
 * server/services/timelineService.js
 * CRUD operations for timeline events.
 */

const { getDb } = require('../db');

const RUNE_ICONS = new Set(['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ']);
const normalizeIcon = (value) => (RUNE_ICONS.has(value) ? value : 'ᚱ');

const createTimelineService = () => {
    const list = () => {
        const db = getDb();
        return db.prepare('SELECT * FROM timeline_events ORDER BY event_date DESC, sort_order ASC').all();
    };

    const getById = (id) => {
        const db = getDb();
        return db.prepare('SELECT * FROM timeline_events WHERE id = ?').get(id) || null;
    };

    const create = (data) => {
        const db = getDb();
        const result = db.prepare(`
      INSERT INTO timeline_events (title, description, event_date, category, icon, color, link_url, link_label, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(data.title, data.description, data.event_date, data.category || 'life',
                        normalizeIcon(data.icon), data.color || '#c9a84c', data.link_url, data.link_label, data.sort_order || 0);
        return getById(result.lastInsertRowid);
    };

    const update = (id, patch) => {
        const db = getDb();
        const allowed = ['title', 'description', 'event_date', 'category', 'icon', 'color', 'link_url', 'link_label', 'sort_order'];
        const updates = Object.entries(patch)
            .filter(([k]) => allowed.includes(k))
            .map(([k, v]) => (k === 'icon' ? [k, normalizeIcon(v)] : [k, v]));
        if (updates.length === 0) return getById(id);

        const setClause = updates.map(([k]) => `${k} = ?`).join(', ');
        db.prepare(`UPDATE timeline_events SET ${setClause} WHERE id = ?`).run(...updates.map(([, v]) => v), id);
        return getById(id);
    };

    const remove = (id) => {
        const db = getDb();
        db.prepare('DELETE FROM timeline_events WHERE id = ?').run(id);
    };

    const reorder = (items) => {
        const db = getDb();
        const tx = db.transaction(() => {
            const stmt = db.prepare('UPDATE timeline_events SET sort_order = ? WHERE id = ?');
            items.forEach(({ id, sort_order }) => stmt.run(sort_order, id));
        });
        tx();
    };

    return { list, getById, create, update, remove, reorder };
};

module.exports = { createTimelineService };
