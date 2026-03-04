/**
 * server/routes/index.js
 * Mounts all route groups on the Express app.
 */

const { createAuthRouter } = require('./auth');
const { createPublicRouter } = require('./public');
const { createAdminRouter } = require('./admin');
const { createApiRouter } = require('./api');

/**
 * mountRoutes — attaches all route handlers to the app.
 * @param {import('express').Express} app
 * @param {Object} services
 * @param {Object} uploadMiddleware
 * @param {Object} config
 */
const mountRoutes = (app, services, uploadMiddleware, config) => {
    // Auth (login/signup/logout)
    app.use('/auth', createAuthRouter(services.auth));

    // API routes (all under /api)
    app.use('/api', createApiRouter(services, uploadMiddleware, config));

    // Admin SPA
    app.use('/admin', createAdminRouter(config));

    // Public pages (must be last — catches / and /entry/:slug etc.)
    app.use('/', createPublicRouter(services));
};

module.exports = { mountRoutes };
