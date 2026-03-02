/**
 * ============================================
 * Route Aggregator
 * ============================================
 * Central place that registers all route modules
 * onto the Express application. Add new route
 * modules here as you create them.
 *
 * Usage:
 *   const { registerRoutes } = require('./routes');
 *   registerRoutes(app, appState);
 */

const { createHomeRouter } = require('./home');
const { createApiRouter } = require('./api');

/**
 * registerRoutes — mounts all route modules onto
 * the Express application instance.
 * @param {import('express').Application} app - The Express app
 * @param {Object} appState - Shared mutable application state
 */
const registerRoutes = (app, appState) => {
    // Mount page routes at root
    app.use('/', createHomeRouter());

    // Mount API routes under /api
    app.use('/api', createApiRouter(appState));

    // Add more route modules here:
    // app.use('/blog', createBlogRouter());
    // app.use('/dashboard', createDashboardRouter());
};

module.exports = { registerRoutes };
