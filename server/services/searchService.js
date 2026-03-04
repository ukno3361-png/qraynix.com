/**
 * server/services/searchService.js
 * Full-text search using SQLite FTS5.
 */

const { getDb } = require('../db');

const createSearchService = () => {
    /**
     * search — queries the FTS5 index.
     * @param {string} query - Search terms
     * @param {number} [limit=20]
     * @returns {Array} Matching entries
     */
    const search = (query, limit = 20) => {
        if (!query || !query.trim()) return [];

        const db = getDb();
        // FTS5 match with ranking
        return db.prepare(`
      SELECT e.*, rank
      FROM entries_fts fts
      JOIN entries e ON e.id = fts.rowid
      WHERE entries_fts MATCH ?
        AND e.status = 'published'
      ORDER BY rank
      LIMIT ?
    `).all(query, limit);
    };

    return { search };
};

module.exports = { createSearchService };
