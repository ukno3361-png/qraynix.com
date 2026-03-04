/**
 * server/utils/logger.js
 * Console logger factory with levels and prefixes.
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

/**
 * createLogger — returns a logger with namespaced prefix.
 * @param {string} name - Logger namespace (e.g. 'AUTH', 'DB')
 * @param {string} [minLevel='info'] - Minimum log level
 * @returns {Object} Logger with debug/info/warn/error methods
 */
const createLogger = (name, minLevel = 'info') => {
    const threshold = LEVELS[minLevel] || 1;
    const prefix = `[${name}]`;

    const log = (level, ...args) => {
        if (LEVELS[level] >= threshold) {
            const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
            console[method](prefix, ...args);
        }
    };

    return {
        debug: (...args) => log('debug', ...args),
        info: (...args) => log('info', ...args),
        warn: (...args) => log('warn', ...args),
        error: (...args) => log('error', ...args),
    };
};

module.exports = { createLogger };
