/**
 * server/app.js
 * Express application factory.
 * Sets up middleware, sessions, views, routes, and error handling.
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const { createRequestLogger } = require('./middleware/requestLogger');
const { attachUser } = require('./middleware/auth');
const { createNotFoundHandler, createErrorHandler } = require('./middleware/errorHandler');
const { createUploadMiddleware } = require('./middleware/upload');
const { mountRoutes } = require('./routes');

// Services
const { createAuthService } = require('./services/authService');
const { createEntryService } = require('./services/entryService');
const { createMediaService } = require('./services/mediaService');
const { createSettingsService } = require('./services/settingsService');
const { createTimelineService } = require('./services/timelineService');
const { createSearchService } = require('./services/searchService');

/**
 * createApp — builds and configures the Express application.
 * @param {Object} config - Application configuration
 * @returns {import('express').Express}
 */
const createApp = (config) => {
    const app = express();

    // ── Security ──
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                imgSrc: ["'self'", 'data:', 'blob:'],
                mediaSrc: ["'self'", 'data:', 'blob:'],
                connectSrc: ["'self'", config.isDev ? 'ws://localhost:*' : ''],
            },
        },
    }));

    // ── Logging ──
    app.use(createRequestLogger(config.isDev));

    // ── Body Parsing ──
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // ── Sessions ──
    app.use(session({
        store: new SQLiteStore({ dir: path.dirname(config.dbPath), db: 'sessions.db' }),
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: !config.isDev,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        },
    }));

    // ── Static Files ──
    app.use(express.static(path.resolve(__dirname, '../public')));
    app.use('/uploads', express.static(config.uploadsPath));

    // ── Views (EJS) ──
    app.set('view engine', 'ejs');
    app.set('views', path.resolve(__dirname, 'views'));

    // ── Attach user + currentPath to all requests ──
    app.use(attachUser);
    app.use((req, res, next) => {
        res.locals.currentPath = req.path;
        next();
    });

    // ── Layout System ──
    // Override res.render to wrap page content in the base layout.
    // Pass { layout: false } to skip layout (e.g. login, error pages).
    app.use((req, res, next) => {
        const originalRender = res.render.bind(res);

        res.render = (view, options = {}, callback) => {
            if (options.layout === false) {
                return originalRender(view, options, callback);
            }

            // Render the page template first
            originalRender(view, options, (err, pageHtml) => {
                if (err) return callback ? callback(err) : next(err);

                // Render the base layout with the page body injected
                originalRender('layout/base', { ...options, body: pageHtml }, callback);
            });
        };

        next();
    });

    // ── Services ──
    const services = {
        auth: createAuthService(),
        entry: createEntryService(),
        media: createMediaService(),
        settings: createSettingsService(),
        timeline: createTimelineService(),
        search: createSearchService(),
    };

    // ── File Upload ──
    const uploadMiddleware = createUploadMiddleware(config.uploadsPath, config.maxFileSize);

    // ── Routes ──
    mountRoutes(app, services, uploadMiddleware, config);

    // ── Error Handling ──
    app.use(createNotFoundHandler());
    app.use(createErrorHandler(config.isDev));

    return app;
};

module.exports = { createApp };
