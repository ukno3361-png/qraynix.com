/**
 * server/routes/api/entertainment.js
 * Admin API for entertainment reviews + iTunes preview search.
 */

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth');

const createEntertainmentRouter = (entertainmentService) => {
    const router = Router();
    router.use(requireAuth);

    // GET /api/entertainment — list reviews
    router.get('/', (req, res) => {
        const status = req.query.status || undefined;
        const type = req.query.type || undefined;
        const includeAll = String(req.query.includeAll || 'true') === 'true';
        const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
        res.json(entertainmentService.list({ status, type, includeAll, offset, limit }));
    });

    // GET /api/entertainment/stats — dashboard stats
    router.get('/stats', (req, res) => {
        res.json(entertainmentService.stats());
    });

    // GET /api/entertainment/itunes-search — proxy iTunes Search API for song previews
    router.get('/itunes-search', async (req, res) => {
        const term = String(req.query.term || '').trim();
        if (!term) return res.json({ results: [] });

        const mediaType = String(req.query.media || 'music').trim();
        const limit = Math.min(10, Math.max(1, parseInt(req.query.limit, 10) || 5));

        try {
            const url = new URL('https://itunes.apple.com/search');
            url.searchParams.set('term', term);
            url.searchParams.set('media', mediaType);
            url.searchParams.set('limit', String(limit));

            const response = await fetch(url.toString());
            if (!response.ok) throw new Error(`iTunes API responded ${response.status}`);

            const data = await response.json();
            const results = (data.results || []).map((item) => ({
                trackName: item.trackName || item.collectionName || '',
                artistName: item.artistName || '',
                collectionName: item.collectionName || '',
                artworkUrl100: item.artworkUrl100 || '',
                previewUrl: item.previewUrl || '',
                trackViewUrl: item.trackViewUrl || '',
                releaseDate: item.releaseDate || '',
                primaryGenreName: item.primaryGenreName || '',
            }));

            res.json({ results });
        } catch (err) {
            res.status(502).json({ error: { message: 'Failed to search iTunes' } });
        }
    });

    // GET /api/entertainment/:id — single review
    router.get('/:id', (req, res) => {
        const item = entertainmentService.getById(parseInt(req.params.id, 10));
        if (!item) return res.status(404).json({ error: { message: 'Review not found' } });
        res.json(item);
    });

    // POST /api/entertainment — create review
    router.post('/', (req, res) => {
        const item = entertainmentService.create(req.body || {});
        res.status(201).json(item);
    });

    // PATCH /api/entertainment/:id — update review
    router.patch('/:id', (req, res) => {
        const existing = entertainmentService.getById(parseInt(req.params.id, 10));
        if (!existing) return res.status(404).json({ error: { message: 'Review not found' } });
        const item = entertainmentService.update(parseInt(req.params.id, 10), req.body || {});
        res.json(item);
    });

    // DELETE /api/entertainment/:id — delete review
    router.delete('/:id', (req, res) => {
        entertainmentService.remove(parseInt(req.params.id, 10));
        res.json({ success: true });
    });

    return router;
};

module.exports = { createEntertainmentRouter };
