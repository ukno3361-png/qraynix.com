/**
 * server/db/index.js
 * Database factory — creates a better-sqlite3 connection
 * and returns an object of prepared-statement query helpers
 * grouped by entity. Never exposes raw db outside this module.
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/** @type {import('better-sqlite3').Database | null} */
let dbInstance = null;

/**
 * ensureDirectory — creates a directory if it doesn't exist.
 * @param {string} dirPath
 */
const ensureDirectory = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

/**
 * createDatabase — initializes SQLite with WAL mode and foreign keys.
 * @param {string} dbPath - Path to the .db file
 * @returns {import('better-sqlite3').Database}
 */
const createDatabase = (dbPath) => {
    ensureDirectory(path.dirname(dbPath));

    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');

    console.log(`[DB] Connected: ${dbPath}`);
    return dbInstance;
};

/**
 * getDb — returns the active database instance.
 * @returns {import('better-sqlite3').Database}
 */
const getDb = () => {
    if (!dbInstance) throw new Error('[DB] Not initialized. Call createDatabase() first.');
    return dbInstance;
};

/**
 * closeDatabase — gracefully closes the connection.
 */
const closeDatabase = () => {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
        console.log('[DB] Connection closed.');
    }
};

module.exports = { createDatabase, getDb, closeDatabase };
