/**
 * server/middleware/upload.js
 * Multer file upload configuration factory.
 * Handles images, audio, and video with type/size validation.
 */

const multer = require('multer');
const path = require('path');
const { v4: uuid } = require('uuid');
const fs = require('fs');

/**
 * MIME type whitelist grouped by category.
 */
const ALLOWED_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/flac'],
    video: ['video/mp4', 'video/webm'],
};

/** Flatten all allowed types into a single array */
const ALL_ALLOWED = Object.values(ALLOWED_TYPES).flat();

/**
 * getMediaCategory — determines the category from MIME type.
 * @param {string} mimeType
 * @returns {'image'|'audio'|'video'|null}
 */
const getMediaCategory = (mimeType) => {
    for (const [category, types] of Object.entries(ALLOWED_TYPES)) {
        if (types.includes(mimeType)) return category;
    }
    return null;
};

/**
 * createUploadMiddleware — factory that builds a Multer instance.
 * Files are stored under uploadsPath/<type>/<YYYY-MM>/<uuid>.<ext>
 * @param {string} uploadsPath - Root uploads directory
 * @param {Object} maxFileSize - Size limits per category
 * @returns {multer.Multer}
 */
const createUploadMiddleware = (uploadsPath, maxFileSize) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const category = getMediaCategory(file.mimetype) || 'other';
            const now = new Date();
            const monthDir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const destPath = path.join(uploadsPath, category, monthDir);

            // Ensure directory exists
            fs.mkdirSync(destPath, { recursive: true });
            cb(null, destPath);
        },

        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, `${uuid()}${ext}`);
        },
    });

    const fileFilter = (req, file, cb) => {
        if (ALL_ALLOWED.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type not allowed: ${file.mimetype}`), false);
        }
    };

    return multer({
        storage,
        fileFilter,
        limits: { fileSize: maxFileSize.video }, // Use largest limit; per-type checks in service
    });
};

module.exports = { createUploadMiddleware, getMediaCategory, ALLOWED_TYPES };
