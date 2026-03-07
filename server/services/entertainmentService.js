/**
 * server/services/entertainmentService.js
 * CRUD operations for entertainment reviews.
 */

const { getDb } = require('../db');

const VALID_TYPES = ['Movie', 'TV Show', 'Music Album', 'Song', 'Podcast', 'Book', 'Game', 'Anime', 'Documentary', 'Other'];
const VALID_STATUS = ['draft', 'published'];
const VALID_WATCH_STATUS = ['Watching', 'Completed', 'Dropped', 'Plan to Watch', 'On Hold'];
const VALID_RECOMMENDATION = ['Must Watch', 'Highly Recommended', 'Recommended', 'Mixed Feelings', 'Not Recommended'];

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

const createEntertainmentService = () => {

    const list = ({ status, type, includeAll = false, offset = 0, limit = 50 } = {}) => {
        const db = getDb();
        const conditions = [];
        const params = [];

        if (!includeAll && status) {
            conditions.push('status = ?');
            params.push(status);
        }
        if (type && type !== 'all') {
            conditions.push('type = ?');
            params.push(type);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const rows = db.prepare(`
            SELECT * FROM entertainment_reviews
            ${where}
            ORDER BY sort_order ASC, updated_at DESC, id DESC
            LIMIT ? OFFSET ?
        `).all(...params, limit, offset);

        const totalRow = db.prepare(`SELECT COUNT(*) as total FROM entertainment_reviews ${where}`).get(...params);
        return { reviews: rows, total: totalRow?.total || 0 };
    };

    const getById = (id) => {
        const db = getDb();
        return db.prepare('SELECT * FROM entertainment_reviews WHERE id = ?').get(id) || null;
    };

    const create = (data = {}) => {
        const db = getDb();
        const type = VALID_TYPES.includes(data.type) ? data.type : 'Movie';
        const rating = clamp(parseInt(data.rating, 10) || 5, 1, 10);
        const watchStatus = VALID_WATCH_STATUS.includes(data.watch_status) ? data.watch_status : 'Completed';
        const recommendation = VALID_RECOMMENDATION.includes(data.recommendation_level) ? data.recommendation_level : 'Recommended';
        const status = VALID_STATUS.includes(data.status) ? data.status : 'draft';

        const result = db.prepare(`
            INSERT INTO entertainment_reviews
                (title, type, rating, review_html, review_text, cover_image, audio_preview_url,
                 external_link, genre, creator, release_year, watch_status, has_spoilers,
                 recommendation_level, featured, status, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            String(data.title || '').trim() || 'Untitled Review',
            type,
            rating,
            String(data.review_html || '').trim(),
            String(data.review_text || '').trim(),
            String(data.cover_image || '').trim(),
            String(data.audio_preview_url || '').trim(),
            String(data.external_link || '').trim(),
            String(data.genre || '').trim(),
            String(data.creator || '').trim(),
            data.release_year ? parseInt(data.release_year, 10) || null : null,
            watchStatus,
            data.has_spoilers ? 1 : 0,
            recommendation,
            data.featured ? 1 : 0,
            status,
            Number.isFinite(Number(data.sort_order)) ? Number(data.sort_order) : 0
        );

        return getById(result.lastInsertRowid);
    };

    const update = (id, patch = {}) => {
        const db = getDb();
        const allowed = [
            'title', 'type', 'rating', 'review_html', 'review_text', 'cover_image',
            'audio_preview_url', 'external_link', 'genre', 'creator', 'release_year',
            'watch_status', 'has_spoilers', 'recommendation_level', 'featured', 'status', 'sort_order'
        ];

        const updates = Object.entries(patch).filter(([key]) => allowed.includes(key));
        if (updates.length === 0) return getById(id);

        const normalized = updates.map(([key, value]) => {
            if (key === 'type') return [key, VALID_TYPES.includes(value) ? value : 'Movie'];
            if (key === 'rating') return [key, clamp(parseInt(value, 10) || 5, 1, 10)];
            if (key === 'watch_status') return [key, VALID_WATCH_STATUS.includes(value) ? value : 'Completed'];
            if (key === 'recommendation_level') return [key, VALID_RECOMMENDATION.includes(value) ? value : 'Recommended'];
            if (key === 'status') return [key, VALID_STATUS.includes(value) ? value : 'draft'];
            if (key === 'has_spoilers' || key === 'featured') return [key, value ? 1 : 0];
            if (key === 'release_year') return [key, value ? parseInt(value, 10) || null : null];
            if (key === 'sort_order') return [key, Number.isFinite(Number(value)) ? Number(value) : 0];
            return [key, String(value || '').trim()];
        });

        const setClause = normalized.map(([key]) => `${key} = ?`).join(', ');
        db.prepare(`
            UPDATE entertainment_reviews
            SET ${setClause}, updated_at = datetime('now')
            WHERE id = ?
        `).run(...normalized.map(([, value]) => value), id);

        return getById(id);
    };

    const remove = (id) => {
        const db = getDb();
        db.prepare('DELETE FROM entertainment_reviews WHERE id = ?').run(id);
    };

    const stats = () => {
        const db = getDb();
        const total = db.prepare('SELECT COUNT(*) as c FROM entertainment_reviews').get()?.c || 0;
        const published = db.prepare("SELECT COUNT(*) as c FROM entertainment_reviews WHERE status = 'published'").get()?.c || 0;
        const featured = db.prepare("SELECT COUNT(*) as c FROM entertainment_reviews WHERE featured = 1 AND status = 'published'").get()?.c || 0;
        const avgRating = db.prepare("SELECT AVG(rating) as avg FROM entertainment_reviews WHERE status = 'published'").get()?.avg || 0;
        const byType = db.prepare("SELECT type, COUNT(*) as count FROM entertainment_reviews WHERE status = 'published' GROUP BY type ORDER BY count DESC").all();
        return { total, published, featured, avgRating: Math.round(avgRating * 10) / 10, byType };
    };

    return { list, getById, create, update, remove, stats };
};

module.exports = { createEntertainmentService };
