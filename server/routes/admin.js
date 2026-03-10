/**
 * server/routes/admin.js
 * Serves the React admin SPA for all /admin/* routes.
 * The built React app is expected at client/dist/index.html.
 */

const { Router } = require('express');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');

/**
 * createAdminRouter — factory for admin SPA shell.
 * @param {Object} config
 * @returns {Router}
 */
const createAdminRouter = (config) => {
  const router = Router();

  // Serve static assets from the React build
  const distPath = path.resolve(__dirname, '../../client/dist');
  const devFallback = path.resolve(__dirname, '../../client/index.html');

  // Serve admin assets
  router.use('/assets', (req, res, next) => {
    const assetPath = path.join(distPath, 'assets', req.path);
    if (fs.existsSync(assetPath)) {
      return res.sendFile(assetPath);
    }
    next();
  });

  // All /admin routes → serve the React SPA index.html
  router.get('/{*path}', requireAuth, (req, res) => {
    const indexFile = path.join(distPath, 'index.html');

    if (fs.existsSync(indexFile)) {
      return res.sendFile(indexFile);
    }

    // Dev fallback: simple HTML that loads Vite dev server
    if (config.isDev) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Qraynix Admin</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>body{font-family:sans-serif;display:grid;place-items:center;min-height:100vh;background:#0b0b0d;color:#e6e6ea;}code{background:#1e2130;padding:2px 8px;border-radius:4px;}</style>
        </head>
        <body>
          <div style="text-align:center">
            <h2>Admin build not found</h2>
            <p>Run <code>npm run build:admin</code> then refresh.</p>
          </div>
        </body>
        </html>
      `);
    }

    res.status(503).send('Admin build not found. Run: npm run build:admin');
  });

  return router;
};

module.exports = { createAdminRouter };
