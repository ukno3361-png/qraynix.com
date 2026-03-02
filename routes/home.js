/**
 * ============================================
 * Home Routes
 * ============================================
 * Defines routes for the main pages of the site.
 * Each route file exports a factory function that
 * returns a configured Express Router.
 *
 * Usage:
 *   const { createHomeRouter } = require('./routes/home');
 *   app.use('/', createHomeRouter());
 */

const { Router } = require('express');
const { renderHomePage } = require('../controllers/homeController');

/**
 * createHomeRouter — factory that builds the home
 * page router with all page-level routes.
 * @returns {import('express').Router}
 */
const createHomeRouter = () => {
    const router = Router();

    // Home / landing page
    router.get('/', renderHomePage);

    // Add more page routes here as you build them:
    // router.get('/about', renderAboutPage);
    // router.get('/contact', renderContactPage);
    // router.get('/services', renderServicesPage);

    return router;
};

module.exports = { createHomeRouter };
