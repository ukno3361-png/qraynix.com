/**
 * server/routes/api/assistant.js
 * Public AI personality bot API.
 */

const { Router } = require('express');
const { createRateLimiter } = require('../../middleware/rateLimit');
const { requireAuth } = require('../../middleware/auth');

const createAssistantRouter = (assistantService) => {
    const router = Router();
    const chatLimiter = createRateLimiter({
        windowMs: 15 * 60 * 1000,
        maxRequests: 30,
        message: 'Too many chat messages right now. Please wait a bit.',
    });

    router.get('/config', (req, res) => {
        const config = assistantService.getBotConfig();
        res.json({
            enabled: config.enabled,
            botName: config.botName,
            ownerName: config.ownerName,
            disclaimer: config.disclaimer,
        });
    });

    router.post('/chat', chatLimiter, async (req, res, next) => {
        try {
            const payload = await assistantService.chat({
                message: req.body?.message,
                history: req.body?.history,
            });
            res.json(payload);
        } catch (err) {
            next(err);
        }
    });

    router.post('/test', requireAuth, async (req, res, next) => {
        try {
            const payload = await assistantService.testConnection({
                model: req.body?.model,
                apiKey: req.body?.apiKey,
            });
            res.json(payload);
        } catch (err) {
            next(err);
        }
    });

    return router;
};

module.exports = { createAssistantRouter };
