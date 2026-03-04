/**
 * server/services/musicService.js
 * CRUD operations for public music tracks.
 */

const { getDb } = require('../db');

const createMusicService = () => {
    const list = ({ includeHidden = false } = {}) => {
        const db = getDb();
        const where = includeHidden ? '' : 'WHERE mt.visible = 1';
        return db.prepare(`
            SELECT
                mt.*,
                m.filename as media_filename,
                m.original_name as media_original_name,
                m.mime_type as media_mime_type
            FROM music_tracks mt
            LEFT JOIN media m ON m.id = mt.media_id
            ${where}
            ORDER BY mt.sort_order ASC, mt.updated_at DESC, mt.id DESC
        `).all();
    };

    const getById = (id) => {
        const db = getDb();
        return db.prepare(`
            SELECT
                mt.*,
                m.filename as media_filename,
                m.original_name as media_original_name,
                m.mime_type as media_mime_type
            FROM music_tracks mt
            LEFT JOIN media m ON m.id = mt.media_id
            WHERE mt.id = ?
        `).get(id) || null;
    };

    const create = (data) => {
        const db = getDb();
        const result = db.prepare(`
            INSERT INTO music_tracks
                (media_id, title, artist, album, album_cover, notes, sort_order, visible)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            data.media_id || null,
            data.title,
            data.artist || null,
            data.album || null,
            data.album_cover || null,
            data.notes || null,
            data.sort_order ?? 0,
            data.visible === false ? 0 : 1
        );

        return getById(result.lastInsertRowid);
    };

    const update = (id, patch) => {
        const db = getDb();
        const allowed = ['media_id', 'title', 'artist', 'album', 'album_cover', 'notes', 'sort_order', 'visible'];
        const updates = Object.entries(patch).filter(([key]) => allowed.includes(key));
        if (updates.length === 0) return getById(id);

        const normalized = updates.map(([key, value]) => {
            if (key === 'visible') return [key, value ? 1 : 0];
            return [key, value];
        });

        const setClause = normalized.map(([key]) => `${key} = ?`).join(', ');
        db.prepare(`UPDATE music_tracks SET ${setClause}, updated_at = datetime('now') WHERE id = ?`)
            .run(...normalized.map(([, value]) => value), id);

        return getById(id);
    };

    const remove = (id) => {
        const db = getDb();
        db.prepare('DELETE FROM music_tracks WHERE id = ?').run(id);
    };

    return { list, getById, create, update, remove };
};

module.exports = { createMusicService };
