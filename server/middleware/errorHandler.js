/**
 * server/middleware/errorHandler.js
 * Centralized error handling middleware.
 * API routes get JSON errors; page routes get rendered error pages.
 */

/**
 * createNotFoundHandler — catches unmatched routes.
 * @returns {import('express').RequestHandler}
 */
const createNotFoundHandler = () => (req, res, next) => {
    const err = new Error(`Not found: ${req.originalUrl}`);
    err.status = 404;
    next(err);
};

/**
 * createErrorHandler — global error handler.
 * @param {boolean} isDev - Show stack traces in dev mode
 * @returns {import('express').ErrorRequestHandler}
 */
const createErrorHandler = (isDev) => (err, req, res, _next) => {
    const status = err.status || 500;
    const routePath = String(req.originalUrl || req.baseUrl || req.path || '');

    if (isDev) {
        console.error(`[ERROR] ${status} — ${err.message}`);
        if (status >= 500) console.error(err.stack);
    }

    // API and Auth routes get JSON
    if (routePath.startsWith('/api/') || routePath.startsWith('/auth/')) {
        return res.status(status).json({
            error: {
                message: err.message || 'Internal server error',
                code: status === 404 ? 'NOT_FOUND' : 'SERVER_ERROR',
                ...(isDev && { stack: err.stack }),
            },
        });
    }

    // Page routes get rendered EJS
    res.status(status).render('pages/error', {
        title: `${status} | Qraynix`,
        statusCode: status,
        message: err.message || 'Something went wrong',
        stack: isDev ? err.stack : null,
    });
};

module.exports = { createNotFoundHandler, createErrorHandler };
