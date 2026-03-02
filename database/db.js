/**
 * ============================================
 * Database Connection Module
 * ============================================
 * Manages the better-sqlite3 database connection
 * using a singleton pattern wrapped in pure functions.
 *
 * better-sqlite3 is synchronous, which makes it
 * simpler and faster for most web applications
 * compared to the async sqlite3 package.
 *
 * Usage:
 *   const { initDatabase, getDatabase, closeDatabase } = require('./database/db');
 *   const db = initDatabase();
 */

const Database = require('better-sqlite3');
const path = require('path');

/** @type {import('better-sqlite3').Database | null} */
let dbInstance = null;

/**
 * initDatabase — creates and configures the SQLite database.
 * Enables WAL mode for better concurrent read performance.
 * @param {string} [dbPath] - Optional custom database file path
 * @returns {import('better-sqlite3').Database} The database instance
 */
const initDatabase = (dbPath) => {
    const resolvedPath = dbPath || path.resolve(__dirname, '..', 'qraynix.db');

    dbInstance = new Database(resolvedPath, {
        // verbose: console.log, // Uncomment for SQL query logging
    });

    // Enable WAL mode for better performance
    dbInstance.pragma('journal_mode = WAL');

    // Enable foreign keys
    dbInstance.pragma('foreign_keys = ON');

    console.log(`[DB] Connected to SQLite database at ${resolvedPath}`);
    return dbInstance;
};

/**
 * getDatabase — returns the existing database instance.
 * Throws if the database has not been initialized.
 * @returns {import('better-sqlite3').Database}
 */
const getDatabase = () => {
    if (!dbInstance) {
        throw new Error('[DB] Database not initialized. Call initDatabase() first.');
    }
    return dbInstance;
};

/**
 * closeDatabase — gracefully closes the database connection.
 * Safe to call even if the database is not open.
 */
const closeDatabase = () => {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
        console.log('[DB] Database connection closed.');
    }
};

module.exports = { initDatabase, getDatabase, closeDatabase };
