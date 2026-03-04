/**
 * server/utils/dateFormat.js
 * Pure date formatting functions.
 * Includes a Roman-numeral inspired format for the Norse theme.
 */

const ROMAN_MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * toRoman — converts a number to Roman numerals (1-3999).
 * @param {number} num
 * @returns {string}
 */
const toRoman = (num) => {
    const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    let result = '';
    let n = Math.floor(num);
    for (let i = 0; i < vals.length; i++) {
        while (n >= vals[i]) {
            result += syms[i];
            n -= vals[i];
        }
    }
    return result;
};

/**
 * formatRunicDate — formats as "XV · March · MMXXV".
 * @param {string|Date} date
 * @returns {string}
 */
const formatRunicDate = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate();
    const month = ROMAN_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    return `${day} · ${month} · ${year}`;
};

/**
 * formatShortDate — "Mar 15, 2025"
 * @param {string|Date} date
 * @returns {string}
 */
const formatShortDate = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * formatISO — returns ISO string for a date.
 * @param {Date} [date]
 * @returns {string}
 */
const formatISO = (date) => (date || new Date()).toISOString();

module.exports = { formatRunicDate, formatShortDate, formatISO, toRoman };
