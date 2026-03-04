/**
 * server/middleware/requestLogger.js
 * Dev-friendly request logger.
 * Uses morgan in dev, minimal in production.
 */

const morgan = require('morgan');

/**
 * createRequestLogger — returns logging middleware.
 * @param {boolean} isDev
 * @returns {import('express').RequestHandler}
 */
const createRequestLogger = (isDev) =>
    isDev ? morgan('dev') : morgan('combined');

module.exports = { createRequestLogger };
