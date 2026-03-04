/**
 * server/routes/public.js
 * Public-facing EJS page routes.
 * Homepage, single entry, timeline, now, login.
 */

const { Router } = require('express');
const { formatRunicDate } = require('../utils/dateFormat');

/**
 * createPublicRouter — factory for public page routes.
 * @param {Object} services
 * @returns {Router}
 */
const createPublicRouter = (services) => {
    const router = Router();

    // GET / — Homepage
    router.get('/', (req, res) => {
        const settings = services.settings.getAll();
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(settings.entries_per_page) || 10;

        const { entries, pagination } = services.entry.list({
            status: 'published', page, limit: perPage,
        });

        // Get visible now blocks
        const { getDb } = require('../db');
        const db = getDb();
        const nowBlocks = settings.show_now === 'true'
            ? db.prepare('SELECT * FROM now_blocks WHERE visible = 1 ORDER BY sort_order ASC').all()
            : [];

        res.render('pages/home', {
            title: settings.site_title || 'Qraynix',
            settings, entries, pagination, nowBlocks,
            formatRunicDate,
        });
    });

    // GET /entry/:slug — Single entry
    router.get('/entry/:slug', (req, res, next) => {
        const entry = services.entry.getBySlug(req.params.slug);
        if (!entry || entry.status !== 'published') {
            const err = new Error('Entry not found');
            err.status = 404;
            return next(err);
        }

        const settings = services.settings.getAll();
        res.render('pages/entry', {
            title: `${entry.title} | ${settings.site_title}`,
            entry, settings, formatRunicDate,
        });
    });

    // GET /timeline
    router.get('/timeline', (req, res) => {
        const settings = services.settings.getAll();
        const events = services.timeline.list();
        const category = req.query.category || 'all';

        res.render('pages/timeline', {
            title: `Timeline | ${settings.site_title}`,
            events, settings, category, formatRunicDate,
        });
    });

    // GET /now
    router.get('/now', (req, res) => {
        const settings = services.settings.getAll();
        const { getDb } = require('../db');
        const db = getDb();
        const blocks = db.prepare('SELECT * FROM now_blocks WHERE visible = 1 ORDER BY sort_order ASC').all();

        res.render('pages/now', {
            title: `Now | ${settings.site_title}`,
            blocks, settings,
        });
    });

    // GET /login
    router.get('/login', (req, res) => {
        const settings = services.settings.getAll();
        const { hasAdminAccount } = require('../middleware/auth');
        const hasAdmin = hasAdminAccount();

        // If already logged in, redirect to admin
        if (req.session && req.session.userId) {
            return res.redirect('/admin');
        }

        res.render('pages/login', {
            title: `${hasAdmin ? 'Login' : 'Setup'} | ${settings.site_title}`,
            settings, hasAdmin,
            layout: false,
        });
    });

    // GET /health
    router.get('/health', (req, res) => {
        res.json({ status: 'ok', uptime: process.uptime() });
    });

    return router;
};

module.exports = { createPublicRouter };
