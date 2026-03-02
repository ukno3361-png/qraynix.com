/**
 * ============================================
 * Database Migrations Module
 * ============================================
 * Defines and runs schema migrations for the
 * SQLite database. Each migration is a pure
 * function that receives the db instance.
 *
 * Add new migrations to the `migrations` array
 * to extend the schema over time.
 *
 * Usage:
 *   const { runMigrations } = require('./database/migrations');
 *   runMigrations(db);
 */

/**
 * migrations — ordered list of migration functions.
 * Each function receives the database instance and
 * creates or alters tables as needed.
 * @type {Array<{name: string, up: (db: import('better-sqlite3').Database) => void}>}
 */
const migrations = [
    {
        name: 'create_settings_table',
        up: (db) => {
            db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key   TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
        },
    },
    {
        name: 'create_pages_table',
        up: (db) => {
            db.exec(`
        CREATE TABLE IF NOT EXISTS pages (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          slug       TEXT UNIQUE NOT NULL,
          title      TEXT NOT NULL,
          content    TEXT DEFAULT '',
          is_active  INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
        },
    },
    {
        name: 'create_contacts_table',
        up: (db) => {
            db.exec(`
        CREATE TABLE IF NOT EXISTS contacts (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          name       TEXT NOT NULL,
          email      TEXT NOT NULL,
          message    TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
        },
    },
    {
        name: 'seed_default_settings',
        up: (db) => {
            // Insert default settings only if they don't exist
            const insertSetting = db.prepare(`
        INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
      `);

            const seedData = [
                ['site_name', 'Qraynix'],
                ['site_tagline', 'Innovation Starts Here'],
                ['coming_soon', 'true'],
            ];

            const seedAll = db.transaction(() => {
                seedData.forEach(([key, value]) => insertSetting.run(key, value));
            });

            seedAll();
        },
    },
];

/**
 * runMigrations — executes all migrations in order.
 * Uses a migrations tracking table to avoid re-running.
 * @param {import('better-sqlite3').Database} db - The database instance
 */
const runMigrations = (db) => {
    // Create migrations tracking table
    db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Check which migrations have been applied
    const applied = db
        .prepare('SELECT name FROM _migrations')
        .all()
        .map((row) => row.name);

    // Run pending migrations inside a transaction
    const pending = migrations.filter((m) => !applied.includes(m.name));

    if (pending.length === 0) {
        console.log('[DB] All migrations are up to date.');
        return;
    }

    const applyMigrations = db.transaction(() => {
        pending.forEach((migration) => {
            console.log(`[DB] Running migration: ${migration.name}`);
            migration.up(db);
            db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(migration.name);
        });
    });

    applyMigrations();
    console.log(`[DB] Applied ${pending.length} migration(s).`);
};

module.exports = { runMigrations };
