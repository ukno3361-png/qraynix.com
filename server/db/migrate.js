/**
 * server/db/migrate.js
 * Migration runner — reads .sql files from migrations/ folder
 * and executes them in order. Tracks applied migrations in
 * a _migrations table to avoid re-running.
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');

/**
 * runMigrations — applies all pending SQL migration files.
 * @param {import('better-sqlite3').Database} db
 */
const runMigrations = (db) => {
    // Create tracking table
    db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT UNIQUE NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // Get already-applied migration names
    const applied = db.prepare('SELECT name FROM _migrations')
        .all()
        .map((r) => r.name);

    // Read and sort migration files
    const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort();

    const pending = files.filter((f) => !applied.includes(f));

    if (pending.length === 0) {
        console.log('[DB] Migrations up to date.');
        return;
    }

    // Apply pending migrations in a transaction
    const applyAll = db.transaction(() => {
        pending.forEach((file) => {
            const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
            console.log(`[DB] Applying: ${file}`);
            db.exec(sql);
            db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
        });
    });

    applyAll();
    console.log(`[DB] Applied ${pending.length} migration(s).`);
};

// Allow running directly: node server/db/migrate.js
if (require.main === module) {
    const { getConfig } = require('../config');
    const { createDatabase } = require('./index');
    const config = getConfig();
    const db = createDatabase(config.dbPath);
    runMigrations(db);
    db.close();
}

module.exports = { runMigrations };
