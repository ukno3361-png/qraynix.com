/**
 * ============================================
 * Home Controller
 * ============================================
 * Contains handler functions for the home/landing
 * page. Each function is a pure request handler
 * that receives (req, res) and renders a view
 * with the appropriate data.
 *
 * Usage:
 *   const { renderHomePage } = require('./controllers/homeController');
 *   router.get('/', renderHomePage);
 */

const { getDatabase } = require('../database/db');

/**
 * getSettingsMap — reads all settings from the DB
 * and returns them as a key-value object.
 * @returns {Object<string, string>} Settings map
 */
const getSettingsMap = () => {
    const db = getDatabase();
    const rows = db.prepare('SELECT key, value FROM settings').all();
    return rows.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {});
};

/**
 * renderHomePage — handles GET / requests.
 * Fetches site settings from the database and
 * renders the home page view.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const renderHomePage = (req, res) => {
    const settings = getSettingsMap();

    res.render('pages/home', {
        title: `${settings.site_name || 'Qraynix'} — ${settings.site_tagline || 'Innovation Starts Here'}`,
        siteName: settings.site_name || 'Qraynix',
        tagline: settings.site_tagline || 'Innovation Starts Here',
    });
};

module.exports = { renderHomePage, getSettingsMap };
