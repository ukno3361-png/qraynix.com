/**
 * server/routes/auth.js
 * Authentication routes: signup (first-run), login, logout, session check.
 */

const { Router } = require('express');
const { createRateLimiter } = require('../middleware/rateLimit');
const { hasAdminAccount } = require('../middleware/auth');

/**
 * createAuthRouter — factory for auth routes.
 * @param {Object} authService
 * @returns {Router}
 */
const createAuthRouter = (authService) => {
    const router = Router();
    const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10 });

    // POST /auth/signup — first-run only, creates the admin account
    router.post('/signup', loginLimiter, async (req, res, next) => {
        try {
            if (hasAdminAccount()) {
                return res.status(403).json({ error: { message: 'Admin exists. Use login.' } });
            }
            const { username, email, password } = req.body;
            if (!username || !email || !password) {
                return res.status(400).json({ error: { message: 'Username, email, and password required' } });
            }
            const user = await authService.signup({ username, email, password });
            req.session.userId = user.id;
            res.json({ user });
        } catch (err) { next(err); }
    });

    // POST /auth/login
    router.post('/login', loginLimiter, async (req, res, next) => {
        try {
            const { identifier, password } = req.body;
            if (!identifier || !password) {
                return res.status(400).json({ error: { message: 'Username/email and password required' } });
            }
            const user = await authService.login({ identifier, password });
            req.session.userId = user.id;
            res.json({ user });
        } catch (err) { next(err); }
    });

    // POST /auth/logout
    router.post('/logout', (req, res) => {
        req.session.destroy(() => {
            res.json({ success: true });
        });
    });

    // GET /auth/me — returns current session user or 401
    router.get('/me', (req, res) => {
        if (!req.session.userId) {
            return res.status(401).json({ error: { message: 'Not authenticated' } });
        }
        const user = authService.getUser(req.session.userId);
        if (!user) return res.status(401).json({ error: { message: 'Session expired' } });
        res.json({ user, hasAdmin: hasAdminAccount() });
    });

    return router;
};

module.exports = { createAuthRouter };
