/**
 * server/routes/api/index.js
 * Mounts all API sub-routers under /api.
 */

const { Router } = require('express');
const { createEntriesRouter } = require('./entries');
const { createMediaRouter } = require('./media');
const { createTimelineRouter } = require('./timeline');
const { createTagsRouter } = require('./tags');
const { createNowRouter } = require('./now');
const { createAccountRouter } = require('./account');
const { createSettingsRouter } = require('./settings');
const { createSearchRouter } = require('./search');

/**
 * createApiRouter — mounts all API routes.
 * @param {Object} services - Service instances
 * @param {Object} uploadMiddleware - Multer instance
 * @param {Object} config
 * @returns {Router}
 */
const createApiRouter = (services, uploadMiddleware, config) => {
    const router = Router();

    router.use('/entries', createEntriesRouter(services.entry));
    router.use('/media', createMediaRouter(services.media, uploadMiddleware, config));
    router.use('/timeline', createTimelineRouter(services.timeline));
    router.use('/tags', createTagsRouter());
    router.use('/now', createNowRouter());
    router.use('/account', createAccountRouter(services.auth, uploadMiddleware));
    router.use('/settings', createSettingsRouter(services.settings));
    router.use('/search', createSearchRouter(services.search));

    return router;
};

module.exports = { createApiRouter };
