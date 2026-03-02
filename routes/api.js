/**
 * ============================================
 * API Routes
 * ============================================
 * Defines all JSON API routes. Receives the shared
 * application state so controllers can modify it
 * at runtime (e.g., toggle coming-soon mode).
 *
 * Usage:
 *   const { createApiRouter } = require('./routes/api');
 *   app.use('/api', createApiRouter(appState));
 */

const { Router } = require('express');
const { createApiController } = require('../controllers/apiController');

/**
 * createApiRouter — factory that builds the API router
 * with all JSON endpoints.
 * @param {Object} appState - Shared mutable application state
 * @returns {import('express').Router}
 */
const createApiRouter = (appState) => {
    const router = Router();
    const api = createApiController(appState);

    // Health check endpoint
    router.get('/health', api.getHealthStatus);

    // Admin: toggle coming soon mode at runtime
    router.post('/admin/toggle-coming-soon', api.toggleComingSoon);

    // Admin: get current application status
    router.get('/admin/status', api.getAdminStatus);

    // Add more API routes here:
    // router.post('/contact', api.submitContactForm);
    // router.get('/pages/:slug', api.getPage);

    return router;
};

module.exports = { createApiRouter };
