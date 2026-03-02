/**
 * ============================================
 * Qraynix — Main Application Entry Point
 * ============================================
 * Bootstraps the Express server by:
 *   1. Loading configuration from .env
 *   2. Initializing the SQLite database
 *   3. Running schema migrations
 *   4. Configuring middleware (security, logging, static files, views)
 *   5. Mounting the coming-soon gate
 *   6. Registering all routes
 *   7. Attaching error handlers
 *   8. Starting the HTTP server with graceful shutdown
 *
 * Usage:
 *   npm start       — production
 *   npm run dev     — development (auto-restart via nodemon)
 */

const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');

// --- Internal Modules ---
const { getConfig } = require('./config');
const { initDatabase, closeDatabase } = require('./database/db');
const { runMigrations } = require('./database/migrations');
const { createComingSoonMiddleware } = require('./middleware/comingSoon');
const { createNotFoundHandler, createErrorHandler } = require('./middleware/errorHandler');
const { registerRoutes } = require('./routes');

/**
 * createApp — factory function that builds and configures
 * the Express application. This pattern makes the app
 * testable and reusable.
 *
 * @param {Object} config - The frozen configuration object
 * @param {Object} appState - Mutable shared application state
 * @returns {import('express').Application} Configured Express app
 */
const createApp = (config, appState) => {
    const app = express();

    // --- Security ---
    // Helmet sets various HTTP security headers
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                },
            },
        })
    );

    // --- Logging ---
    if (config.isDev) {
        app.use(morgan('dev'));
    }

    // --- Body Parsing ---
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // --- Static Files ---
    app.use(express.static(path.join(__dirname, 'public')));

    // --- View Engine (EJS) ---
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    // --- EJS Layout Support ---
    // Simple layout system: we render the page into a `body` variable
    // and then render the layout wrapping it.
    app.use((req, res, next) => {
        const originalRender = res.render.bind(res);

        /**
         * Override res.render to support layouts.
         * If the view options include `layout: false`, render directly.
         * Otherwise, render the page first, then inject it into the layout.
         */
        res.render = (view, options = {}, callback) => {
            if (options.layout === false) {
                // Render without layout (e.g., coming-soon page)
                return originalRender(view, options, callback);
            }

            // Render the page view to a string
            originalRender(view, options, (err, html) => {
                if (err) return next(err);

                // Render the layout, injecting the page HTML as `body`
                originalRender('layouts/main', { ...options, body: html }, callback);
            });
        };

        next();
    });

    // --- Coming Soon Middleware ---
    // This must be AFTER static files but BEFORE routes
    app.use(createComingSoonMiddleware(appState));

    // --- Routes ---
    registerRoutes(app, appState);

    // --- Error Handling ---
    app.use(createNotFoundHandler());
    app.use(createErrorHandler(config.isDev));

    return app;
};

/**
 * startServer — initializes the database, creates the app,
 * and starts listening for HTTP connections.
 */
const startServer = () => {
    // 1. Load configuration
    const config = getConfig();

    // 2. Create shared application state
    //    This object is mutable so middleware and controllers
    //    can modify it at runtime (e.g., toggle coming soon)
    const appState = {
        comingSoon: config.comingSoon,
    };

    // 3. Initialize database and run migrations
    const db = initDatabase();
    runMigrations(db);

    // 4. Build the Express app
    const app = createApp(config, appState);

    // 5. Start listening
    const server = app.listen(config.port, () => {
        console.log('');
        console.log('  ╔══════════════════════════════════════════╗');
        console.log('  ║          🚀 Qraynix Server Running       ║');
        console.log('  ╠══════════════════════════════════════════╣');
        console.log(`  ║  URL:  http://localhost:${config.port}             ║`);
        console.log(`  ║  ENV:  ${config.nodeEnv.padEnd(30)}  ║`);
        console.log(`  ║  Coming Soon: ${String(appState.comingSoon).padEnd(23)}  ║`);
        console.log('  ╚══════════════════════════════════════════╝');
        console.log('');
    });

    // 6. Graceful shutdown
    const shutdown = (signal) => {
        console.log(`\n[SERVER] ${signal} received. Shutting down gracefully...`);
        server.close(() => {
            closeDatabase();
            console.log('[SERVER] Server closed.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};

// --- Start the application ---
startServer();
