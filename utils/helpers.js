/**
 * ============================================
 * Utility Helpers
 * ============================================
 * A collection of pure utility functions with
 * no side effects. These can be used anywhere
 * in the application — routes, controllers,
 * or even in EJS templates.
 *
 * Usage:
 *   const { formatDate, slugify, sanitizeInput, createResponse } = require('./utils/helpers');
 */

/**
 * formatDate — formats a Date object or date string
 * into a human-readable string.
 * @param {Date|string} date - The date to format
 * @param {string} [locale='en-US'] - Locale for formatting
 * @returns {string} Formatted date string
 */
const formatDate = (date, locale = 'en-US') => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

/**
 * slugify — converts a string into a URL-friendly slug.
 * @param {string} text - The text to slugify
 * @returns {string} URL-safe slug
 */
const slugify = (text) =>
    text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')       // Replace spaces with hyphens
        .replace(/[^\w-]+/g, '')    // Remove non-word characters
        .replace(/--+/g, '-')       // Collapse multiple hyphens
        .replace(/^-+|-+$/g, '');   // Trim leading/trailing hyphens

/**
 * sanitizeInput — basic sanitization to prevent XSS.
 * Escapes HTML special characters.
 * @param {string} input - Raw user input
 * @returns {string} Sanitized string
 */
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
    };
    return input.replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * createResponse — builds a consistent JSON response object.
 * @param {boolean} success - Whether the operation succeeded
 * @param {*} data - The response payload
 * @param {string|null} [message=null] - Optional message
 * @returns {{ success: boolean, data: *, message: string|null, timestamp: string }}
 */
const createResponse = (success, data, message = null) =>
    Object.freeze({
        success,
        data,
        message,
        timestamp: new Date().toISOString(),
    });

/**
 * truncate — truncates a string to a maximum length
 * and appends an ellipsis if it was shortened.
 * @param {string} text - The text to truncate
 * @param {number} [maxLength=100] - Maximum character length
 * @returns {string}
 */
const truncate = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text || '';
    return `${text.slice(0, maxLength)}...`;
};

module.exports = {
    formatDate,
    slugify,
    sanitizeInput,
    createResponse,
    truncate,
};
