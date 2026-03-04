/**
 * server/routes/api/tags.js
 * CRUD routes for tags (with entry counts).
 */

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth');
const { getDb } = require('../../db');
const { slugify } = require('../../utils/slugify');

const createTagsRouter = () => {
    const router = Router();
    router.use(requireAuth);

    // GET /api/tags — list all tags with entry counts
    router.get('/', (req, res) => {
        const db = getDb();
        const tags = db.prepare(`
      SELECT t.*, COUNT(et.entry_id) as entry_count
      FROM tags t LEFT JOIN entry_tags et ON et.tag_id = t.id
      GROUP BY t.id ORDER BY t.name
    `).all();
        res.json(tags);
    });

    // POST /api/tags
    router.post('/', (req, res) => {
        const db = getDb();
        const { name, color } = req.body;
        if (!name) return res.status(400).json({ error: { message: 'Name required' } });
        const slug = slugify(name);
        const result = db.prepare('INSERT INTO tags (name, slug, color) VALUES (?, ?, ?)').run(name, slug, color || '#c9a84c');
        res.status(201).json(db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid));
    });

    // PATCH /api/tags/:id
    router.patch('/:id', (req, res) => {
        const db = getDb();
        const { name, color } = req.body;
        const updates = [];
        const params = [];
        if (name) { updates.push('name = ?', 'slug = ?'); params.push(name, slugify(name)); }
        if (color) { updates.push('color = ?'); params.push(color); }
        if (updates.length === 0) return res.json(db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id));
        db.prepare(`UPDATE tags SET ${updates.join(', ')} WHERE id = ?`).run(...params, req.params.id);
        res.json(db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id));
    });

    // DELETE /api/tags/:id
    router.delete('/:id', (req, res) => {
        const db = getDb();
        db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    });

    return router;
};

module.exports = { createTagsRouter };
