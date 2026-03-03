/**
 * ============================================
 * Coming Soon Middleware
 * ============================================
 * Factory function that returns Express middleware.
 * When the coming soon flag is enabled, all page
 * requests are redirected to the coming-soon view.
 *
 * Static assets (/css, /js, /images) and API routes
 * are always allowed through.
 *
 * Usage:
 *   const { createComingSoonMiddleware } = require('./middleware/comingSoon');
 *   app.use(createComingSoonMiddleware(appState));
 */

/**
 * Paths that should always bypass the coming soon check.
 * Uses startsWith matching for efficiency.
 * @type {string[]}
 */
const BYPASS_PREFIXES = [
    '/api/',        // All API endpoints
    '/css/',        // Stylesheets
    '/js/',         // Client-side scripts
    '/images/',     // Static images
    '/favicon.ico', // Browser favicon
];

/**
 * shouldBypass — checks if a request path should skip
 * the coming soon middleware.
 * @param {string} path - The request URL path
 * @returns {boolean} True if the path should bypass
 */
const shouldBypass = (path) =>
    BYPASS_PREFIXES.some((prefix) => path.startsWith(prefix));

/**
 * createComingSoonMiddleware — factory that produces
 * the coming soon gate middleware.
 * @param {Object} appState - Mutable application state object
 * @param {boolean} appState.comingSoon - Whether coming soon mode is active
 * @returns {import('express').RequestHandler} Express middleware
 */
const createComingSoonMiddleware = (appState) => (req, res, next) => {
    // Let bypassed paths through regardless of coming soon state
    if (shouldBypass(req.path)) {
        return next();
    }

    // If coming soon mode is active, show the coming soon page
    if (appState.comingSoon) {
        return res.status(200).render('pages/coming-soon', {
            title: 'Coming Soon | Qraynix',
            layout: false, // Coming soon page uses its own full layout
        });
    }

    // Otherwise, continue to the normal route handler
    next();
};

module.exports = { createComingSoonMiddleware, shouldBypass };
