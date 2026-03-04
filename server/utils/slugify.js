/**
 * server/utils/slugify.js
 * Pure function: converts a string into a URL-safe slug.
 */

/**
 * slugify — transforms text into a URL slug.
 * @param {string} text
 * @returns {string}
 */
const slugify = (text) =>
    (text || '')
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');

module.exports = { slugify };
