/**
 * server/routes/api/thoughtFlash.js
 * Admin API for Thought Flash items.
 */

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth');

const createThoughtFlashRouter = (thoughtFlashService) => {
    const router = Router();
    router.use(requireAuth);

    router.get('/', (req, res) => {
        const includeHidden = String(req.query.includeHidden || 'false') === 'true';
        const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 100));
        res.json(thoughtFlashService.list({ includeHidden, offset, limit }));
    });

    router.post('/', (req, res) => {
        const item = thoughtFlashService.create(req.body || {});
        res.status(201).json(item);
    });

    router.patch('/:id', (req, res) => {
        const item = thoughtFlashService.update(parseInt(req.params.id, 10), req.body || {});
        res.json(item);
    });

    router.delete('/:id', (req, res) => {
        thoughtFlashService.remove(parseInt(req.params.id, 10));
        res.json({ success: true });
    });

    router.post('/reorder', (req, res) => {
        thoughtFlashService.reorder(req.body.items || []);
        res.json({ success: true });
    });

    return router;
};

module.exports = { createThoughtFlashRouter };
