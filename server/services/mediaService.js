/**
 * server/services/mediaService.js
 * Business logic for uploaded media files.
 */

const { getDb } = require('../db');
const fs = require('fs');
const path = require('path');

const createMediaService = () => {
    const list = ({ type, entry_id, page = 1, limit = 30 } = {}) => {
        const db = getDb();
        let where = [];
        let params = [];

        if (type) { where.push('mime_type LIKE ?'); params.push(`${type}/%`); }
        if (entry_id) { where.push('entry_id = ?'); params.push(entry_id); }

        const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const total = db.prepare(`SELECT COUNT(*) as c FROM media ${whereClause}`).get(...params).c;
        const offset = (Math.max(1, page) - 1) * limit;

        const items = db.prepare(`SELECT * FROM media ${whereClause} ORDER BY uploaded_at DESC LIMIT ? OFFSET ?`)
            .all(...params, limit, offset);

        return { items, total, page, limit };
    };

    const getById = (id) => {
        const db = getDb();
        return db.prepare('SELECT * FROM media WHERE id = ?').get(id) || null;
    };

    const create = (fileData) => {
        const db = getDb();
        const result = db.prepare(`
      INSERT INTO media (entry_id, filename, original_name, mime_type, size_bytes,
        width, height, duration_sec, thumb_path, alt_text, caption)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            fileData.entry_id || null, fileData.filename, fileData.original_name,
            fileData.mime_type, fileData.size_bytes,
            fileData.width || null, fileData.height || null,
            fileData.duration_sec || null, fileData.thumb_path || null,
            fileData.alt_text || null, fileData.caption || null
        );
        return getById(result.lastInsertRowid);
    };

    const update = (id, patch) => {
        const db = getDb();
        const allowed = ['alt_text', 'caption', 'entry_id'];
        const updates = Object.entries(patch).filter(([k]) => allowed.includes(k));
        if (updates.length === 0) return getById(id);

        const setClause = updates.map(([k]) => `${k} = ?`).join(', ');
        db.prepare(`UPDATE media SET ${setClause} WHERE id = ?`).run(...updates.map(([, v]) => v), id);
        return getById(id);
    };

    const remove = (id, uploadsPath) => {
        const db = getDb();
        const media = getById(id);
        if (!media) return;

        // Delete file from disk
        const filePath = path.join(uploadsPath, media.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (media.thumb_path) {
            const thumbPath = path.join(uploadsPath, media.thumb_path);
            if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        }

        db.prepare('DELETE FROM media WHERE id = ?').run(id);
    };

    const getStats = () => {
        const db = getDb();
        return {
            total: db.prepare('SELECT COUNT(*) as c FROM media').get().c,
            totalSize: db.prepare('SELECT COALESCE(SUM(size_bytes), 0) as c FROM media').get().c,
        };
    };

    return { list, getById, create, update, remove, getStats };
};

module.exports = { createMediaService };
