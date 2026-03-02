/**
 * ============================================
 * Error Handling Middleware
 * ============================================
 * Two factory functions that produce Express
 * error-handling middleware:
 *   1. 404 Not Found handler
 *   2. Global error handler (with dev/prod modes)
 *
 * Usage:
 *   const { createNotFoundHandler, createErrorHandler } = require('./middleware/errorHandler');
 *   app.use(createNotFoundHandler());
 *   app.use(createErrorHandler(isDev));
 */

/**
 * createNotFoundHandler — returns middleware that catches
 * any request that didn't match a route and forwards
 * a 404 error to the global error handler.
 * @returns {import('express').RequestHandler}
 */
const createNotFoundHandler = () => (req, res, next) => {
    const error = new Error(`Page not found: ${req.originalUrl}`);
    error.status = 404;
    next(error);
};

/**
 * createErrorHandler — returns the global error handler.
 * In development mode, it includes the error stack trace.
 * In production, it hides internal details.
 * @param {boolean} isDev - Whether we are in development mode
 * @returns {import('express').ErrorRequestHandler}
 */
const createErrorHandler = (isDev) => (err, req, res, _next) => {
    const statusCode = err.status || 500;

    // Log the error in development
    if (isDev) {
        console.error(`[ERROR] ${statusCode} - ${err.message}`);
        console.error(err.stack);
    }

    res.status(statusCode).render('pages/error', {
        title: `${statusCode} Error | Qraynix`,
        statusCode,
        message: err.message || 'Something went wrong',
        stack: isDev ? err.stack : null,
    });
};

module.exports = { createNotFoundHandler, createErrorHandler };
