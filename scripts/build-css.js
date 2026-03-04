/**
 * scripts/build-css.js
 * Compiles SCSS → public/css/main.css using the sass package.
 */

const sass = require('sass');
const fs = require('fs');
const path = require('path');

const INPUT = path.resolve(__dirname, '../client/src/styles/main.scss');
const OUTPUT_DIR = path.resolve(__dirname, '../public/css');
const OUTPUT = path.join(OUTPUT_DIR, 'main.css');

const build = () => {
    // Ensure output directory exists
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    try {
        const result = sass.compile(INPUT, {
            style: process.env.NODE_ENV === 'production' ? 'compressed' : 'expanded',
            sourceMap: true,
            loadPaths: [path.resolve(__dirname, '../client/src/styles')],
        });

        fs.writeFileSync(OUTPUT, result.css);
        if (result.sourceMap) {
            fs.writeFileSync(`${OUTPUT}.map`, JSON.stringify(result.sourceMap));
        }

        console.log(`[CSS] Compiled → ${OUTPUT}`);
    } catch (err) {
        console.error('[CSS] Build error:', err.message);
        process.exitCode = 1;
    }
};

build();
module.exports = { build };
