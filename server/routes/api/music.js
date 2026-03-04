/**
 * server/routes/api/music.js
 * Admin API for music tracks.
 */

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth');

const createMusicRouter = (musicService) => {
    const router = Router();
    router.use(requireAuth);

    router.get('/', (req, res) => {
        const includeHidden = String(req.query.includeHidden || 'false') === 'true';
        res.json(musicService.list({ includeHidden }));
    });

    router.post('/', (req, res) => {
        const track = musicService.create(req.body || {});
        res.status(201).json(track);
    });

    router.patch('/:id', (req, res) => {
        const track = musicService.update(parseInt(req.params.id, 10), req.body || {});
        res.json(track);
    });

    router.delete('/:id', (req, res) => {
        musicService.remove(parseInt(req.params.id, 10));
        res.json({ success: true });
    });

    return router;
};

module.exports = { createMusicRouter };
