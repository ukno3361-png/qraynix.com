/**
 * server/routes/api/future.js
 * CRUD API for future messages / letters to future self.
 */

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth');
const { getDb } = require('../../db');

const createFutureRouter = () => {
    const router = Router();
    router.use(requireAuth);

    router.get('/', (req, res) => {
        const db = getDb();
        const rows = db.prepare(`
            SELECT *
            FROM future_messages
            ORDER BY is_pinned DESC, target_date DESC, updated_at DESC, id DESC
        `).all();
        res.json(rows);
    });

    router.post('/', (req, res) => {
        const db = getDb();
        const {
            title,
            message,
            mood,
            target_date,
            is_public,
            is_pinned,
        } = req.body;

        const result = db.prepare(`
            INSERT INTO future_messages (title, message, mood, target_date, is_public, is_pinned)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            (title || 'Untitled future letter').trim(),
            (message || '').trim(),
            (mood || '').trim() || null,
            target_date || null,
            is_public === false ? 0 : 1,
            is_pinned ? 1 : 0
        );

        const row = db.prepare('SELECT * FROM future_messages WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(row);
    });

    router.patch('/:id', (req, res) => {
        const db = getDb();
        const allowed = ['title', 'message', 'mood', 'target_date', 'is_public', 'is_pinned'];
        const updates = Object.entries(req.body).filter(([key]) => allowed.includes(key));

        if (updates.length === 0) {
            return res.json(db.prepare('SELECT * FROM future_messages WHERE id = ?').get(req.params.id));
        }

        const normalized = updates.map(([key, value]) => {
            if (key === 'is_public' || key === 'is_pinned') {
                return [key, value ? 1 : 0];
            }
            if (typeof value === 'string') {
                return [key, value.trim()];
            }
            return [key, value];
        });

        const setClause = normalized.map(([key]) => `${key} = ?`).join(', ');
        db.prepare(`UPDATE future_messages SET ${setClause}, updated_at = datetime('now') WHERE id = ?`)
            .run(...normalized.map(([, value]) => value), req.params.id);

        res.json(db.prepare('SELECT * FROM future_messages WHERE id = ?').get(req.params.id));
    });

    router.delete('/:id', (req, res) => {
        const db = getDb();
        db.prepare('DELETE FROM future_messages WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    });

    return router;
};

module.exports = { createFutureRouter };
