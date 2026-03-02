/**
 * ============================================
 * Configuration Module
 * ============================================
 * Reads environment variables and returns a frozen
 * configuration object. Uses the functional pattern
 * of a factory function that returns immutable data.
 *
 * Usage:
 *   const { getConfig } = require('./config');
 *   const config = getConfig();
 */

const dotenv = require('dotenv');
const path = require('path');

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * parseBoolean — safely converts a string to boolean.
 * @param {string} value - The string value to parse
 * @param {boolean} fallback - Default if value is undefined
 * @returns {boolean}
 */
const parseBoolean = (value, fallback = false) => {
    if (value === undefined || value === null) return fallback;
    return value.toLowerCase() === 'true';
};

/**
 * getConfig — returns an immutable configuration object
 * built from environment variables.
 * @returns {Readonly<Object>} Frozen config object
 */
const getConfig = () =>
    Object.freeze({
        port: parseInt(process.env.PORT, 10) || 3000,
        comingSoon: parseBoolean(process.env.COMING_SOON, true),
        nodeEnv: process.env.NODE_ENV || 'development',
        sessionSecret: process.env.SESSION_SECRET || 'default-secret',
        isDev: (process.env.NODE_ENV || 'development') === 'development',
    });

module.exports = { getConfig, parseBoolean };
