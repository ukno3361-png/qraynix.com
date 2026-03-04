/**
 * server/middleware/auth.js
 * Authentication middleware factories.
 * Checks session for logged-in user. Also checks if any
 * admin account exists (for first-run setup flow).
 */

const { getDb } = require('../db');

/**
 * hasAdminAccount — checks if any user exists in the DB.
 * Used to determine whether to show signup or login.
 * @returns {boolean}
 */
const hasAdminAccount = () => {
    const db = getDb();
    const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
    return row.count > 0;
};

/**
 * requireAuth — middleware that blocks unauthenticated requests.
 * Returns 401 JSON for API routes, redirects to /login for pages.
 */
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }

    // API routes get JSON error
    if ((req.originalUrl || '').startsWith('/api/') || (req.baseUrl || '').startsWith('/api')) {
        return res.status(401).json({ error: { message: 'Unauthorized', code: 'AUTH_REQUIRED' } });
    }

    // Page routes redirect to login
    return res.redirect('/login');
};

/**
 * requireGuest — middleware that blocks authenticated users.
 * Redirects to /admin if already logged in.
 */
const requireGuest = (req, res, next) => {
    if (req.session && req.session.userId) {
        return res.redirect('/admin');
    }
    return next();
};

/**
 * attachUser — middleware that attaches the current user
 * to res.locals for use in EJS templates.
 */
const attachUser = (req, res, next) => {
    res.locals.currentUser = null;
    res.locals.hasAdmin = hasAdminAccount();

    if (req.session && req.session.userId) {
        try {
            const db = getDb();
            const user = db.prepare('SELECT id, username, display_name, avatar_path FROM users WHERE id = ?')
                .get(req.session.userId);
            res.locals.currentUser = user || null;
        } catch (err) {
            // Session user not found — clear stale session
            req.session.userId = null;
        }
    }

    next();
};

module.exports = { requireAuth, requireGuest, attachUser, hasAdminAccount };
