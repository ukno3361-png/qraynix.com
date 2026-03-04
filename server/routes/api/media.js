/**
 * server/routes/api/media.js
 * Upload, list, update, and delete media files.
 */

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth');

const createMediaRouter = (mediaService, uploadMiddleware, config) => {
    const router = Router();
    router.use(requireAuth);

    // GET /api/media
    router.get('/', (req, res, next) => {
        try {
            const { type, entry_id, page, limit } = req.query;
            res.json(mediaService.list({ type, entry_id, page, limit }));
        } catch (err) { next(err); }
    });

    // POST /api/media/upload — multipart upload
    router.post('/upload', uploadMiddleware.array('files', 10), (req, res, next) => {
        try {
            const results = (req.files || []).map((file) => {
                const relativePath = file.path.replace(config.uploadsPath, '').replace(/\\/g, '/');
                return mediaService.create({
                    filename: relativePath,
                    original_name: file.originalname,
                    mime_type: file.mimetype,
                    size_bytes: file.size,
                    entry_id: req.body.entry_id || null,
                });
            });
            res.status(201).json(results);
        } catch (err) { next(err); }
    });

    // PATCH /api/media/:id
    router.patch('/:id', (req, res, next) => {
        try {
            const media = mediaService.update(parseInt(req.params.id, 10), req.body);
            res.json(media);
        } catch (err) { next(err); }
    });

    // DELETE /api/media/:id
    router.delete('/:id', (req, res, next) => {
        try {
            mediaService.remove(parseInt(req.params.id, 10), config.uploadsPath);
            res.json({ success: true });
        } catch (err) { next(err); }
    });

    return router;
};

module.exports = { createMediaRouter };
