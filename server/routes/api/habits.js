/**
 * server/routes/api/habits.js
 * Habit tracker admin API.
 */

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth');

const createHabitsRouter = (habitService) => {
    const router = Router();
    router.use(requireAuth);

    router.get('/', (req, res) => {
        const includeHidden = String(req.query.includeHidden || 'true') === 'true';
        res.json(habitService.list({ includeHidden }));
    });

    router.post('/', (req, res) => {
        res.status(201).json(habitService.create(req.body || {}));
    });

    router.patch('/:id', (req, res) => {
        res.json(habitService.update(parseInt(req.params.id, 10), req.body || {}));
    });

    router.delete('/:id', (req, res) => {
        habitService.remove(parseInt(req.params.id, 10));
        res.json({ success: true });
    });

    router.post('/reorder', (req, res) => {
        habitService.reorder(req.body.items || []);
        res.json({ success: true });
    });

    router.get('/:id/logs', (req, res) => {
        res.json(habitService.listLogs({
            habitId: parseInt(req.params.id, 10),
            startDate: req.query.startDate,
            endDate: req.query.endDate,
        }));
    });

    router.put('/:id/log/:date', (req, res) => {
        res.json(habitService.upsertLog({
            habitId: parseInt(req.params.id, 10),
            date: req.params.date,
            status: req.body?.status || 'complete',
            note: req.body?.note || null,
        }));
    });

    return router;
};

module.exports = { createHabitsRouter };
