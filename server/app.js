/**
 * server/app.js
 * Application entry point.
 * Initializes database, runs migrations, starts the Express server,
 * and handles graceful shutdown.
 */

const { getConfig } = require('./config');
const { createDatabase, closeDatabase } = require('./db');
const { runMigrations } = require('./db/migrate');
const { createApp } = require('./createApp');

const start = () => {
    const config = getConfig();

    const db = createDatabase(config.dbPath);
    runMigrations(db);

    const app = createApp(config);

    const server = app.listen(config.port, () => {
        console.log(`
  ╔══════════════════════════════════════════╗
  ║       ◈ Qraynix Server Running          ║
  ╠══════════════════════════════════════════╣
  ║  URL:  http://localhost:${String(config.port).padEnd(19)}║
  ║  ENV:  ${config.nodeEnv.padEnd(33)}║
  ╚══════════════════════════════════════════╝
    `);
    });

    const shutdown = (signal) => {
        console.log(`\n[${signal}] Shutting down...`);
        server.close(() => {
            closeDatabase();
            console.log('[SERVER] Goodbye.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};

start();
