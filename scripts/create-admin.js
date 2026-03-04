/**
 * scripts/create-admin.js
 * CLI script to create the first admin user.
 * Usage: node scripts/create-admin.js
 */

const readline = require('readline');
const bcrypt = require('bcrypt');
const { getConfig } = require('../server/config');
const { createDatabase, closeDatabase } = require('../server/db');
const { runMigrations } = require('../server/db/migrate');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

const main = async () => {
    const config = getConfig();
    const db = createDatabase(config.dbPath);
    runMigrations(db);

    const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    if (count > 0) {
        console.log('Admin account already exists. Use the web UI to manage accounts.');
        closeDatabase();
        rl.close();
        return;
    }

    console.log('\n◈ Qraynix — Create Admin Account\n');

    const username = await ask('Username: ');
    const email = await ask('Email: ');
    const password = await ask('Password: ');

    if (!username || !email || !password) {
        console.log('All fields required.');
        closeDatabase();
        rl.close();
        return;
    }

    const hash = await bcrypt.hash(password, 12);
    db.prepare(
        'INSERT INTO users (username, email, password, display_name) VALUES (?, ?, ?, ?)'
    ).run(username, email, hash, username);

    console.log(`\n✓ Admin "${username}" created. Start the server and go to /login\n`);

    closeDatabase();
    rl.close();
};

main().catch(console.error);
