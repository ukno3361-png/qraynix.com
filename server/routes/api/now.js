/**
 * server/routes/api/now.js
 * "Now" blocks CRUD + reorder API.
 */

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth');
const { getDb } = require('../../db');

const createNowRouter = () => {
    const router = Router();
    router.use(requireAuth);

    router.get('/', (req, res) => {
        const db = getDb();
        res.json(db.prepare('SELECT * FROM now_blocks ORDER BY sort_order ASC').all());
    });

    router.post('/', (req, res) => {
        const db = getDb();
        const { title, content, icon, sort_order, visible } = req.body;
        const result = db.prepare(
            'INSERT INTO now_blocks (title, content, icon, sort_order, visible) VALUES (?, ?, ?, ?, ?)'
        ).run(title, content, icon || null, sort_order || 0, visible !== false ? 1 : 0);
        res.status(201).json(db.prepare('SELECT * FROM now_blocks WHERE id = ?').get(result.lastInsertRowid));
    });

    router.patch('/:id', (req, res) => {
        const db = getDb();
        const allowed = ['title', 'content', 'icon', 'sort_order', 'visible'];
        const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
        if (updates.length === 0) return res.json(db.prepare('SELECT * FROM now_blocks WHERE id = ?').get(req.params.id));
        const set = updates.map(([k]) => `${k} = ?`).join(', ');
        db.prepare(`UPDATE now_blocks SET ${set}, updated_at = datetime('now') WHERE id = ?`)
            .run(...updates.map(([, v]) => v), req.params.id);
        res.json(db.prepare('SELECT * FROM now_blocks WHERE id = ?').get(req.params.id));
    });

    router.delete('/:id', (req, res) => {
        const db = getDb();
        db.prepare('DELETE FROM now_blocks WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    });

    router.post('/reorder', (req, res) => {
        const db = getDb();
        const tx = db.transaction(() => {
            const stmt = db.prepare('UPDATE now_blocks SET sort_order = ? WHERE id = ?');
            (req.body.items || []).forEach(({ id, sort_order }) => stmt.run(sort_order, id));
        });
        tx();
        res.json({ success: true });
    });

    return router;
};

module.exports = { createNowRouter };
