/**
 * scripts/watch-css.js
 * Watches SCSS files for changes and recompiles.
 */

const fs = require('fs');
const path = require('path');

const STYLES_DIR = path.resolve(__dirname, '../client/src/styles');

console.log('[CSS] Watching for changes...');

// Build once on start
require('./build-css');

// Watch for changes
fs.watch(STYLES_DIR, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.scss')) {
        console.log(`[CSS] Changed: ${filename}`);
        // Re-require build to get fresh compilation
        delete require.cache[require.resolve('./build-css')];
        require('./build-css');
    }
});
