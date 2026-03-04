/**
 * server/middleware/rateLimit.js
 * Simple in-memory rate limiter factory.
 * Tracks request counts per IP within a time window.
 */

/**
 * createRateLimiter — factory that returns rate-limiting middleware.
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Max requests per window
 * @param {string} [options.message] - Error message when limit exceeded
 * @returns {import('express').RequestHandler}
 */
const createRateLimiter = ({ windowMs = 15 * 60 * 1000, maxRequests = 5, message = 'Too many requests' } = {}) => {
    const clients = new Map();

    // Clean up expired entries periodically
    setInterval(() => {
        const now = Date.now();
        for (const [ip, data] of clients) {
            if (now - data.start > windowMs) {
                clients.delete(ip);
            }
        }
    }, windowMs);

    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const client = clients.get(ip);

        if (!client || now - client.start > windowMs) {
            // New window
            clients.set(ip, { start: now, count: 1 });
            return next();
        }

        client.count += 1;

        if (client.count > maxRequests) {
            return res.status(429).json({
                error: { message, code: 'RATE_LIMITED' },
            });
        }

        next();
    };
};

module.exports = { createRateLimiter };
