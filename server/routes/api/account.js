/**
 * server/routes/api/account.js
 * Account management API: profile, avatar, password.
 */

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth');

const createAccountRouter = (authService, uploadMiddleware) => {
    const router = Router();
    router.use(requireAuth);

    // GET /api/account
    router.get('/', (req, res) => {
        const user = authService.getUser(req.session.userId);
        if (!user) return res.status(404).json({ error: { message: 'User not found' } });
        res.json(user);
    });

    // PATCH /api/account
    router.patch('/', (req, res, next) => {
        try {
            const user = authService.updateUser(req.session.userId, req.body);
            res.json(user);
        } catch (err) { next(err); }
    });

    // POST /api/account/avatar
    router.post('/avatar', uploadMiddleware.single('avatar'), (req, res, next) => {
        try {
            if (!req.file) return res.status(400).json({ error: { message: 'No file uploaded' } });
            const avatarPath = req.file.path.replace(/\\/g, '/');
            const user = authService.updateUser(req.session.userId, { avatar_path: avatarPath });
            res.json(user);
        } catch (err) { next(err); }
    });

    // POST /api/account/password
    router.post('/password', async (req, res, next) => {
        try {
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: { message: 'Both passwords required' } });
            }
            await authService.changePassword(req.session.userId, currentPassword, newPassword);
            res.json({ success: true });
        } catch (err) { next(err); }
    });

    return router;
};

module.exports = { createAccountRouter };
