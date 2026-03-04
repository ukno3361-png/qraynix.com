/**
 * PM2 Ecosystem Config
 * Production process manager configuration for Qraynix.
 */
module.exports = {
    apps: [{
        name: 'qraynix',
        script: 'app.js',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '512M',
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000,
        },
    }],
};
