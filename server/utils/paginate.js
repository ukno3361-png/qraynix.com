/**
 * server/utils/paginate.js
 * Pure pagination utility.
 */

/**
 * paginate — computes pagination metadata.
 * @param {number} total - Total number of items
 * @param {number} [page=1] - Current page (1-indexed)
 * @param {number} [perPage=10] - Items per page
 * @returns {{ page, perPage, total, totalPages, offset, hasNext, hasPrev }}
 */
const paginate = (total, page = 1, perPage = 10) => {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safePerPage = Math.max(1, Math.min(100, parseInt(perPage, 10) || 10));
    const totalPages = Math.ceil(total / safePerPage);

    return Object.freeze({
        page: safePage,
        perPage: safePerPage,
        total,
        totalPages,
        offset: (safePage - 1) * safePerPage,
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1,
    });
};

module.exports = { paginate };
