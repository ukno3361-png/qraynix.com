/**
 * ============================================
 * API Controller
 * ============================================
 * Handler functions for API endpoints. These
 * return JSON responses and handle administrative
 * operations like toggling coming-soon mode.
 *
 * Usage:
 *   const { getHealthStatus, toggleComingSoon, getAdminStatus } = require('./controllers/apiController');
 */

const { createResponse } = require('../utils/helpers');

/**
 * createApiController — factory function that creates
 * API handlers bound to the shared application state.
 * This allows the toggle to modify the runtime state
 * without restarting the server.
 *
 * @param {Object} appState - Mutable application state
 * @param {boolean} appState.comingSoon - Coming soon flag
 * @returns {Object} Object containing API handler functions
 */
const createApiController = (appState) => ({
    /**
     * getHealthStatus — returns server health information.
     * GET /api/health
     */
    getHealthStatus: (req, res) => {
        res.json(
            createResponse(true, {
                status: 'healthy',
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage().heapUsed,
                timestamp: new Date().toISOString(),
            })
        );
    },

    /**
     * toggleComingSoon — flips the coming soon flag at runtime.
     * POST /api/admin/toggle-coming-soon
     *
     * This modifies the shared appState object, which is
     * referenced by the coming soon middleware. No restart needed.
     */
    toggleComingSoon: (req, res) => {
        // Flip the flag
        appState.comingSoon = !appState.comingSoon;

        console.log(`[API] Coming soon mode: ${appState.comingSoon ? 'ON' : 'OFF'}`);

        res.json(
            createResponse(true, { comingSoon: appState.comingSoon },
                `Coming soon mode is now ${appState.comingSoon ? 'enabled' : 'disabled'}.`
            )
        );
    },

    /**
     * getAdminStatus — returns the current application state.
     * GET /api/admin/status
     */
    getAdminStatus: (req, res) => {
        res.json(
            createResponse(true, {
                comingSoon: appState.comingSoon,
                nodeEnv: process.env.NODE_ENV || 'development',
                uptime: process.uptime(),
            })
        );
    },
});

module.exports = { createApiController };
