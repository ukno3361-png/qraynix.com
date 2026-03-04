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
const { createFutureRouter } = require('./future');
const { createMusicRouter } = require('./music');
const { createHabitsRouter } = require('./habits');
const { createThoughtFlashRouter } = require('./thoughtFlash');
const { createAssistantRouter } = require('./assistant');

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
    router.use('/future', createFutureRouter());
    router.use('/music', createMusicRouter(services.music));
    router.use('/habits', createHabitsRouter(services.habits));
    router.use('/thought-flash', createThoughtFlashRouter(services.thoughtFlash));
    router.use('/assistant', createAssistantRouter(services.assistant));

    return router;
};

module.exports = { createApiRouter };
