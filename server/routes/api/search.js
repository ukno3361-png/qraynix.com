/**
 * server/routes/api/search.js
 * Full-text search endpoint.
 */

const { Router } = require('express');

const createSearchRouter = (searchService) => {
    const router = Router();

    // GET /api/search?q=...
    router.get('/', (req, res, next) => {
        try {
            const { q, limit } = req.query;
            if (!q) return res.json([]);
            res.json(searchService.search(q, parseInt(limit) || 20));
        } catch (err) { next(err); }
    });

    return router;
};

module.exports = { createSearchRouter };
