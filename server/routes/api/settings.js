/**
 * server/routes/api/settings.js
 * Site-wide settings API.
 */

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth');

const createSettingsRouter = (settingsService) => {
    const router = Router();
    router.use(requireAuth);

    router.get('/', (req, res) => res.json(settingsService.getAll()));
    router.patch('/', (req, res) => {
        settingsService.updateMany(req.body);
        res.json(settingsService.getAll());
    });

    return router;
};

module.exports = { createSettingsRouter };
