/**
 * server/routes/api/dbTools.js
 * Admin-only database utility endpoints.
 *
 * Supports:
 * - Listing database files in the data directory
 * - Cloning one DB file into another and running migrations on the clone
 * - Running migrations in-place on an existing DB file (with optional backup)
 */

const { Router } = require('express');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { requireAuth } = require('../../middleware/auth');
const { runMigrations } = require('../../db/migrate');

const DB_FILE_RE = /^[A-Za-z0-9_.-]+\.db$/;

const createDbToolsRouter = (config) => {
    const router = Router();
    const dataDir = path.resolve(path.dirname(config.dbPath));

    const backupFileNameFor = (dbFileName) => {
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const stem = dbFileName.replace(/\.db$/i, '');
        return `${stem}.backup-${ts}.db`;
    };

    // Use SQLite's own copy mechanism for a consistent backup.
    const vacuumInto = (db, backupPath) => {
        const escaped = backupPath.replace(/'/g, "''");
        db.exec(`VACUUM INTO '${escaped}'`);
    };

    const assertFileName = (value, fieldName) => {
        if (!value || typeof value !== 'string' || !DB_FILE_RE.test(value)) {
            const err = new Error(`${fieldName} must be a valid .db filename`);
            err.status = 400;
            throw err;
        }
    };

    router.use(requireAuth);

    // GET /api/db-tools/status
    router.get('/status', (req, res, next) => {
        try {
            const relDataDir = path.relative(process.cwd(), dataDir) || path.basename(dataDir) || 'data';
            res.json({
                dataDir: `./${relDataDir.replace(/\\/g, '/')}`,
                currentDbFile: path.basename(config.dbPath),
            });
        } catch (err) {
            next(err);
        }
    });

    // GET /api/db-tools/files
    router.get('/files', (req, res, next) => {
        try {
            if (!fs.existsSync(dataDir)) {
                return res.json({ files: [] });
            }

            const files = fs.readdirSync(dataDir)
                .filter((name) => DB_FILE_RE.test(name))
                .map((name) => {
                    const fullPath = path.join(dataDir, name);
                    const stats = fs.statSync(fullPath);
                    return {
                        name,
                        sizeBytes: stats.size,
                        modifiedAt: stats.mtime.toISOString(),
                    };
                })
                .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));

            res.json({ files });
        } catch (err) {
            next(err);
        }
    });

    // POST /api/db-tools/clone-migrate
    router.post('/clone-migrate', (req, res, next) => {
        try {
            const sourceFile = String(req.body?.sourceFile || '').trim();
            const targetFile = String(req.body?.targetFile || '').trim();
            const overwrite = !!req.body?.overwrite;

            assertFileName(sourceFile, 'sourceFile');
            assertFileName(targetFile, 'targetFile');

            if (sourceFile === targetFile) {
                return res.status(400).json({ error: { message: 'sourceFile and targetFile must be different' } });
            }

            const sourcePath = path.join(dataDir, sourceFile);
            const targetPath = path.join(dataDir, targetFile);

            if (!fs.existsSync(sourcePath)) {
                return res.status(404).json({ error: { message: `Source DB not found: ${sourceFile}` } });
            }

            if (fs.existsSync(targetPath) && !overwrite) {
                return res.status(409).json({
                    error: {
                        message: `Target DB already exists: ${targetFile}`,
                        code: 'TARGET_EXISTS',
                    },
                });
            }

            fs.copyFileSync(sourcePath, targetPath);

            const db = new Database(targetPath);
            try {
                db.pragma('journal_mode = WAL');
                db.pragma('foreign_keys = ON');
                runMigrations(db);
            } finally {
                db.close();
            }

            res.json({
                success: true,
                sourceFile,
                targetFile,
                sourcePath,
                targetPath,
                suggestedEnv: `DB_PATH=./data/${targetFile}`,
                message: 'Clone complete and migrations applied to target DB.',
            });
        } catch (err) {
            next(err);
        }
    });

    // POST /api/db-tools/migrate-in-place
    router.post('/migrate-in-place', (req, res, next) => {
        try {
            const targetFile = String(req.body?.targetFile || '').trim();
            const createBackup = req.body?.createBackup !== false;

            assertFileName(targetFile, 'targetFile');

            const targetPath = path.join(dataDir, targetFile);
            if (!fs.existsSync(targetPath)) {
                return res.status(404).json({ error: { message: `Target DB not found: ${targetFile}` } });
            }

            const db = new Database(targetPath);
            let backupFile = null;
            let backupPath = null;

            try {
                db.pragma('journal_mode = WAL');
                db.pragma('foreign_keys = ON');

                if (createBackup) {
                    backupFile = backupFileNameFor(targetFile);
                    backupPath = path.join(dataDir, backupFile);
                    vacuumInto(db, backupPath);
                }

                runMigrations(db);
            } finally {
                db.close();
            }

            res.json({
                success: true,
                targetFile,
                backupCreated: createBackup,
                backupFile,
                message: 'In-place migration completed successfully.',
            });
        } catch (err) {
            next(err);
        }
    });

    return router;
};

module.exports = { createDbToolsRouter };
