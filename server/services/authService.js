/**
 * server/services/authService.js
 * Authentication business logic.
 * Handles login, signup (first-run), and session management.
 */

const bcrypt = require('bcrypt');
const { getDb } = require('../db');

const SALT_ROUNDS = 12;

/**
 * createAuthService — factory for auth operations.
 * @returns {Object} Auth methods
 */
const createAuthService = () => {
    /**
     * signup — creates the first admin user (only works if no users exist).
     * @param {{ username: string, email: string, password: string }} data
     * @returns {{ id, username, email }}
     */
    const signup = async ({ username, email, password }) => {
        const db = getDb();
        const existingCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;

        if (existingCount > 0) {
            throw Object.assign(new Error('Admin account already exists. Use login instead.'), { status: 403 });
        }

        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const result = db.prepare(
            'INSERT INTO users (username, email, password, display_name) VALUES (?, ?, ?, ?)'
        ).run(username, email, hash, username);

        return { id: result.lastInsertRowid, username, email };
    };

    /**
     * login — authenticates with username/email + password.
     * @param {{ identifier: string, password: string }} data
     * @returns {{ id, username, email, display_name, avatar_path }}
     */
    const login = async ({ identifier, password }) => {
        const db = getDb();
        const user = db.prepare(
            'SELECT * FROM users WHERE username = ? OR email = ?'
        ).get(identifier, identifier);

        if (!user) {
            throw Object.assign(new Error('Invalid credentials'), { status: 401 });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            throw Object.assign(new Error('Invalid credentials'), { status: 401 });
        }

        // Return user without password hash
        const { password: _, ...safeUser } = user;
        return safeUser;
    };

    /**
     * getUser — retrieves user by ID (no password).
     * @param {number} id
     * @returns {Object|null}
     */
    const getUser = (id) => {
        const db = getDb();
        const user = db.prepare(
            'SELECT id, username, email, display_name, bio, avatar_path, created_at FROM users WHERE id = ?'
        ).get(id);
        return user || null;
    };

    /**
     * updateUser — updates user profile fields.
     * @param {number} id
     * @param {Object} patch - Fields to update
     * @returns {Object} Updated user
     */
    const updateUser = (id, patch) => {
        const db = getDb();
        const allowed = ['display_name', 'bio', 'email', 'avatar_path'];
        const updates = Object.entries(patch).filter(([k]) => allowed.includes(k));

        if (updates.length === 0) return getUser(id);

        const setClause = updates.map(([k]) => `${k} = ?`).join(', ');
        const values = updates.map(([, v]) => v);

        db.prepare(`UPDATE users SET ${setClause}, updated_at = datetime('now') WHERE id = ?`)
            .run(...values, id);

        return getUser(id);
    };

    /**
     * changePassword — updates password after verifying current one.
     * @param {number} id
     * @param {string} currentPassword
     * @param {string} newPassword
     */
    const changePassword = async (id, currentPassword, newPassword) => {
        const db = getDb();
        const user = db.prepare('SELECT password FROM users WHERE id = ?').get(id);

        if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) throw Object.assign(new Error('Current password is incorrect'), { status: 401 });

        const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?").run(hash, id);
    };

    return { signup, login, getUser, updateUser, changePassword };
};

module.exports = { createAuthService };
