/**
 * server/utils/sanitize.js
 * HTML sanitization using DOMPurify (server-side via jsdom).
 */

const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * sanitizeHtml — cleans HTML to prevent XSS.
 * @param {string} html - Raw HTML string
 * @returns {string} Sanitized HTML
 */
const sanitizeHtml = (html) => {
    if (!html) return '';
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
            'strong', 'em', 'u', 's', 'sub', 'sup', 'mark', 'code', 'pre',
            'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'video', 'audio', 'source',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'div', 'span', 'figure', 'figcaption', 'details', 'summary',
            'input', // for task lists
        ],
        ALLOWED_ATTR: [
            'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
            'width', 'height', 'controls', 'poster', 'type', 'checked', 'disabled',
            'data-type', 'data-language', 'style', 'colspan', 'rowspan',
        ],
    });
};

/**
 * escapeHtml — escapes special HTML characters.
 * @param {string} str
 * @returns {string}
 */
const escapeHtml = (str) => {
    if (!str) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
    return str.replace(/[&<>"']/g, (c) => map[c]);
};

module.exports = { sanitizeHtml, escapeHtml };
