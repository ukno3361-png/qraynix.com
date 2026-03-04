/**
 * server/routes/api/entries.js
 * CRUD API routes for journal entries.
 */

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth');

const createEntriesRouter = (entryService) => {
    const router = Router();

    // All entry API routes require authentication
    router.use(requireAuth);

    // GET /api/entries — list with filters
    router.get('/', (req, res, next) => {
        try {
            const { status, tag, page, limit, search, featured } = req.query;
            const result = entryService.list({ status, tag, page, limit, search, featured });
            res.json(result);
        } catch (err) { next(err); }
    });

    // GET /api/entries/:id
    router.get('/:id', (req, res, next) => {
        try {
            const entry = entryService.getById(parseInt(req.params.id, 10));
            if (!entry) return res.status(404).json({ error: { message: 'Entry not found' } });
            res.json(entry);
        } catch (err) { next(err); }
    });

    // POST /api/entries — create
    router.post('/', (req, res, next) => {
        try {
            const entry = entryService.create(req.body);
            res.status(201).json(entry);
        } catch (err) { next(err); }
    });

    // PATCH /api/entries/:id — update
    router.patch('/:id', (req, res, next) => {
        try {
            const entry = entryService.update(parseInt(req.params.id, 10), req.body);
            res.json(entry);
        } catch (err) { next(err); }
    });

    // DELETE /api/entries/:id
    router.delete('/:id', (req, res, next) => {
        try {
            entryService.remove(parseInt(req.params.id, 10));
            res.json({ success: true });
        } catch (err) { next(err); }
    });

    // POST /api/entries/:id/publish
    router.post('/:id/publish', (req, res, next) => {
        try {
            const entry = entryService.update(parseInt(req.params.id, 10), { status: 'published' });
            res.json(entry);
        } catch (err) { next(err); }
    });

    // POST /api/entries/:id/unpublish
    router.post('/:id/unpublish', (req, res, next) => {
        try {
            const entry = entryService.update(parseInt(req.params.id, 10), { status: 'draft' });
            res.json(entry);
        } catch (err) { next(err); }
    });

    // GET /api/entries/:id/versions
    router.get('/:id/versions', (req, res, next) => {
        try {
            const versions = entryService.getVersions(parseInt(req.params.id, 10));
            res.json(versions);
        } catch (err) { next(err); }
    });

    // PUT /api/entries/:id/tags — update entry tags
    router.put('/:id/tags', (req, res, next) => {
        try {
            const { tagIds } = req.body;
            entryService.updateTags(parseInt(req.params.id, 10), tagIds || []);
            res.json({ success: true });
        } catch (err) { next(err); }
    });

    return router;
};

module.exports = { createEntriesRouter };
