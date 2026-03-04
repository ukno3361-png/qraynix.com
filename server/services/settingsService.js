/**
 * server/services/settingsService.js
 * Read/write site-wide settings from the settings table.
 */

const { getDb } = require('../db');

/**
 * createSettingsService — factory for settings operations.
 * @returns {Object}
 */
const createSettingsService = () => {
    /** getAll — returns all settings as a key-value map. */
    const getAll = () => {
        const db = getDb();
        const rows = db.prepare('SELECT key, value FROM settings').all();
        return rows.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {});
    };

    /** get — returns a single setting value. */
    const get = (key) => {
        const db = getDb();
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
        return row ? row.value : null;
    };

    /** set — upserts one setting. */
    const set = (key, value) => {
        const db = getDb();
        db.prepare(
            "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')"
        ).run(key, value, value);
    };

    /** updateMany — upserts multiple settings. */
    const updateMany = (updates) => {
        const db = getDb();
        const tx = db.transaction(() => {
            Object.entries(updates).forEach(([key, value]) => set(key, value));
        });
        tx();
    };

    return { getAll, get, set, updateMany };
};

module.exports = { createSettingsService };
