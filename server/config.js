/**
 * server/config.js
 * Centralized configuration factory.
 * Reads environment variables and returns a frozen config object.
 * All config access should go through getConfig().
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * getConfig — returns an immutable configuration object.
 * @returns {Readonly<Object>}
 */
const getConfig = () =>
    Object.freeze({
        port: parseInt(process.env.PORT, 10) || 3000,
        nodeEnv: process.env.NODE_ENV || 'development',
        isDev: (process.env.NODE_ENV || 'development') === 'development',
        sessionSecret: process.env.SESSION_SECRET || 'default-change-me',
        dbPath: path.resolve(process.env.DB_PATH || './data/journal.db'),
        uploadsPath: path.resolve(process.env.UPLOADS_PATH || './uploads'),
        siteUrl: process.env.SITE_URL || 'http://localhost:3000',
        maxFileSize: {
            image: 10 * 1024 * 1024,   // 10MB
            audio: 50 * 1024 * 1024,   // 50MB
            video: 500 * 1024 * 1024,  // 500MB
        },
    });

module.exports = { getConfig };
