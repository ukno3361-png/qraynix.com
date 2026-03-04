/**
 * server/routes/api/timeline.js
 * Timeline event CRUD + reorder API.
 */

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth');

const createTimelineRouter = (timelineService) => {
    const router = Router();
    router.use(requireAuth);

    router.get('/', (req, res) => res.json(timelineService.list()));
    router.post('/', (req, res, next) => {
        try { res.status(201).json(timelineService.create(req.body)); }
        catch (err) { next(err); }
    });
    router.patch('/:id', (req, res, next) => {
        try { res.json(timelineService.update(parseInt(req.params.id, 10), req.body)); }
        catch (err) { next(err); }
    });
    router.delete('/:id', (req, res) => {
        timelineService.remove(parseInt(req.params.id, 10));
        res.json({ success: true });
    });
    router.post('/reorder', (req, res) => {
        timelineService.reorder(req.body.items || []);
        res.json({ success: true });
    });

    return router;
};

module.exports = { createTimelineRouter };
