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
    const status = err.status
        || err.statusCode
        || (err.code === 'LIMIT_FILE_SIZE' ? 413 : undefined)
        || (err.type === 'entity.too.large' ? 413 : undefined)
        || 500;
    const routePath = String(req.originalUrl || req.baseUrl || req.path || '');
    const message = (() => {
        if (err.code === 'LIMIT_FILE_SIZE') return 'Uploaded file is too large for current server limits.';
        if (err.type === 'entity.too.large' || status === 413) return err.message || 'Upload payload is too large.';
        return err.message || 'Internal server error';
    })();

    if (isDev) {
        console.error(`[ERROR] ${status} — ${message}`);
        if (status >= 500) console.error(err.stack);
    }

    // API and Auth routes get JSON
    if (routePath.startsWith('/api/') || routePath.startsWith('/auth/')) {
        return res.status(status).json({
            error: {
                message,
                code: status === 404 ? 'NOT_FOUND' : 'SERVER_ERROR',
                ...(isDev && { stack: err.stack }),
            },
        });
    }

    // Page routes get rendered EJS
    res.status(status).render('pages/error', {
        title: `${status} | Qraynix`,
        statusCode: status,
        message,
        stack: isDev ? err.stack : null,
    });
};

module.exports = { createNotFoundHandler, createErrorHandler };
