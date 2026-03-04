/**
 * server/routes/public.js
 * Public-facing EJS page routes.
 * Homepage, single entry, timeline, now, login.
 */

const { Router } = require('express');
const { formatRunicDate } = require('../utils/dateFormat');
const { sanitizeHtml } = require('../utils/sanitize');

const PLACEHOLDER_FLASHES = [
    {
        id: 'ph-1',
        media_type: 'image',
        media_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%25" stop-color="%23111215"/><stop offset="100%25" stop-color="%23242a3f"/></linearGradient></defs><rect width="100%25" height="100%25" fill="url(%23g)"/><text x="50%25" y="54%25" fill="%23b19bcf" text-anchor="middle" font-size="52" font-family="serif">Placeholder I</text></svg>',
        preview_text: 'A still horizon and static hum in my head.',
        thought_text: 'Testing thought modal layout with a short reflection.',
    },
    {
        id: 'ph-2',
        media_type: 'image',
        media_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="700" height="980"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%25" stop-color="%2310151b"/><stop offset="100%25" stop-color="%23313454"/></linearGradient></defs><rect width="100%25" height="100%25" fill="url(%23g)"/><circle cx="50%25" cy="42%25" r="110" fill="%23b19bcf" fill-opacity="0.22"/><text x="50%25" y="80%25" fill="%23d1c2e8" text-anchor="middle" font-size="44" font-family="serif">Placeholder II</text></svg>',
        preview_text: 'Night thoughts stacked like vertical windows.',
        thought_text: 'Another placeholder to validate variable card heights.',
    },
    {
        id: 'ph-3',
        media_type: 'image',
        media_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="620"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0%25" stop-color="%23101011"/><stop offset="100%25" stop-color="%23424d7a"/></linearGradient></defs><rect width="100%25" height="100%25" fill="url(%23g)"/><path d="M0 430 Q240 300 500 420 T1000 390 V620 H0Z" fill="%23b19bcf" fill-opacity="0.18"/><text x="50%25" y="52%25" fill="%23efe9fb" text-anchor="middle" font-size="54" font-family="serif">Placeholder III</text></svg>',
        preview_text: 'Cloud trails and unfinished sentences.',
        thought_text: 'Use this placeholder for wide media-card behavior.',
    },
    {
        id: 'ph-4',
        media_type: 'image',
        media_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="760" height="760"><defs><radialGradient id="g" cx="50%25" cy="45%25" r="70%25"><stop offset="0%25" stop-color="%2340496e"/><stop offset="100%25" stop-color="%230c0d10"/></radialGradient></defs><rect width="100%25" height="100%25" fill="url(%23g)"/><text x="50%25" y="55%25" fill="%23d7caee" text-anchor="middle" font-size="48" font-family="serif">Placeholder IV</text></svg>',
        preview_text: 'Circular echoes in a square room.',
        thought_text: 'A balanced square asset for responsive-grid testing.',
    },
];

/**
 * createPublicRouter — factory for public page routes.
 * @param {Object} services
 * @returns {Router}
 */
const createPublicRouter = (services) => {
    const router = Router();

    const pageEnabled = (settings, key) => settings[key] !== 'false';
    const rejectHiddenPage = (next, label) => {
        const err = new Error(`${label} is currently unavailable`);
        err.status = 404;
        return next(err);
    };

    // GET / — Homepage
    router.get('/', (req, res) => {
        const settings = services.settings.getAll();
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(settings.entries_per_page) || 10;

        const { entries, pagination } = services.entry.list({
            status: 'published', page, limit: perPage,
        });

        // Get visible now blocks
        const { getDb } = require('../db');
        const db = getDb();
        const nowBlocks = settings.show_now === 'true'
            ? db.prepare('SELECT * FROM now_blocks WHERE visible = 1 ORDER BY sort_order ASC, updated_at DESC, id DESC').all()
            : [];

        res.render('pages/home', {
            title: settings.site_title || 'Qraynix',
            settings, entries, pagination, nowBlocks,
            formatRunicDate,
        });
    });

    // GET /entry/:slug — Single entry
    router.get('/entry/:slug', (req, res, next) => {
        const entry = services.entry.getBySlug(req.params.slug);
        if (!entry || entry.status !== 'published') {
            const err = new Error('Entry not found');
            err.status = 404;
            return next(err);
        }

        const settings = services.settings.getAll();
        res.render('pages/entry', {
            title: `${entry.title} | ${settings.site_title}`,
            entry, settings, formatRunicDate,
        });
    });

    // GET /timeline
    router.get('/timeline', (req, res, next) => {
        const settings = services.settings.getAll();
        if (!pageEnabled(settings, 'show_timeline')) return rejectHiddenPage(next, 'Timeline');
        const events = services.timeline.list();
        const category = req.query.category || 'all';

        res.render('pages/timeline', {
            title: `Timeline | ${settings.site_title}`,
            events, settings, category, formatRunicDate,
        });
    });

    // GET /now
    router.get('/now', (req, res, next) => {
        const settings = services.settings.getAll();
        if (!pageEnabled(settings, 'show_now')) return rejectHiddenPage(next, 'Now');
        const { getDb } = require('../db');
        const db = getDb();
        const blocks = db.prepare('SELECT * FROM now_blocks WHERE visible = 1 ORDER BY sort_order ASC, updated_at DESC, id DESC').all();

        res.render('pages/now', {
            title: `Now | ${settings.site_title}`,
            blocks, settings,
        });
    });

    // GET /future
    router.get('/future', (req, res, next) => {
        const settings = services.settings.getAll();
        if (!pageEnabled(settings, 'show_future')) return rejectHiddenPage(next, 'Future');
        const { getDb } = require('../db');
        const db = getDb();

        const letters = db.prepare(`
            SELECT *
            FROM future_messages
            WHERE is_public = 1
            ORDER BY is_pinned DESC, target_date DESC, updated_at DESC, id DESC
        `).all();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const openLetters = [];
        const lockedLetters = [];

        letters.forEach((letter) => {
            if (!letter.target_date) {
                openLetters.push(letter);
                return;
            }

            const targetDate = new Date(letter.target_date);
            targetDate.setHours(0, 0, 0, 0);

            if (targetDate <= today) {
                openLetters.push(letter);
            } else {
                const msPerDay = 24 * 60 * 60 * 1000;
                const daysLeft = Math.ceil((targetDate.getTime() - today.getTime()) / msPerDay);
                lockedLetters.push({ ...letter, daysLeft });
            }
        });

        res.render('pages/future', {
            title: `Future | ${settings.site_title}`,
            settings,
            openLetters,
            lockedLetters,
        });
    });

    // GET /music
    router.get('/music', (req, res, next) => {
        const settings = services.settings.getAll();
        if (!pageEnabled(settings, 'show_music')) return rejectHiddenPage(next, 'Music');

        const sourceMode = (settings.music_source || 'local').toLowerCase();
        const spotifyRaw = (settings.spotify_playlist_url || '').trim();

        const toSpotifyEmbedUrl = (value) => {
            if (!value) return null;
            if (value.includes('open.spotify.com/embed/playlist/')) return value;

            const idFromUri = value.match(/^spotify:playlist:([a-zA-Z0-9]+)$/);
            if (idFromUri) return `https://open.spotify.com/embed/playlist/${idFromUri[1]}?utm_source=generator`;

            const idFromUrl = value.match(/playlist\/([a-zA-Z0-9]+)(?:\?|$)/);
            if (idFromUrl) return `https://open.spotify.com/embed/playlist/${idFromUrl[1]}?utm_source=generator`;

            return null;
        };

        const spotifyEmbedUrl = toSpotifyEmbedUrl(spotifyRaw);
        const useSpotify = sourceMode === 'spotify' && !!spotifyEmbedUrl;

        const tracks = services.music.list().map((track) => ({
            ...track,
            audio_url: track.media_filename ? `/uploads${track.media_filename}` : null,
            cover_url: track.album_cover || null,
        })).filter((track) => track.audio_url);

        res.render('pages/music', {
            title: `Music | ${settings.site_title}`,
            settings,
            tracks,
            useSpotify,
            spotifyEmbedUrl,
        });
    });

    // GET /habit-tracker
    router.get('/habit-tracker', (req, res, next) => {
        const settings = services.settings.getAll();
        if (!pageEnabled(settings, 'show_habits')) return rejectHiddenPage(next, 'Habit Tracker');

        const habits = services.habits.list();
        res.render('pages/habitTracker', {
            title: `Habit Tracker | ${settings.site_title}`,
            settings,
            habits,
        });
    });

    // GET /live-cam
    router.get('/live-cam', (req, res, next) => {
        const settings = services.settings.getAll();
        if (!pageEnabled(settings, 'show_livecam')) return rejectHiddenPage(next, 'Live Cam');

        res.render('pages/liveCam', {
            title: `Live Cam | ${settings.site_title}`,
            settings,
        });
    });

    // GET /thought-flash
    router.get('/thought-flash', (req, res) => {
        const settings = services.settings.getAll();
        const items = services.thoughtFlash.list({ includeHidden: false, offset: 0, limit: 12 });
        const usePlaceholders = items.length === 0;

        const prepared = (usePlaceholders ? PLACEHOLDER_FLASHES : items).map((item) => ({
            ...item,
            preview_text: sanitizeHtml(String(item.preview_text || '')),
            thought_text: sanitizeHtml(String(item.thought_text || '').replace(/\r?\n/g, '<br>')),
        }));

        res.render('pages/thoughtFlash', {
            title: `Thought Flash | ${settings.site_title}`,
            settings,
            items: prepared,
            usePlaceholders,
        });
    });

    // GET /thought-flash/feed (public infinite scroll)
    router.get('/thought-flash/feed', (req, res) => {
        const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
        const limit = Math.min(24, Math.max(1, parseInt(req.query.limit, 10) || 12));
        const items = services.thoughtFlash.list({ includeHidden: false, offset, limit });
        const total = services.thoughtFlash.countVisible();

        res.json({
            items: items.map((item) => ({
                ...item,
                preview_text: sanitizeHtml(String(item.preview_text || '')),
                thought_text: sanitizeHtml(String(item.thought_text || '').replace(/\r?\n/g, '<br>')),
            })),
            hasMore: offset + items.length < total,
        });
    });

    // GET /login
    router.get('/login', (req, res) => {
        const settings = services.settings.getAll();
        const { hasAdminAccount } = require('../middleware/auth');
        const hasAdmin = hasAdminAccount();

        // If already logged in, redirect to admin
        if (req.session && req.session.userId) {
            return res.redirect('/admin');
        }

        res.render('pages/login', {
            title: `${hasAdmin ? 'Login' : 'Setup'} | ${settings.site_title}`,
            settings, hasAdmin,
            layout: false,
        });
    });

    // GET /health
    router.get('/health', (req, res, next) => {
        const settings = services.settings.getAll();
        if (!pageEnabled(settings, 'show_health')) return rejectHiddenPage(next, 'Health');

        const toSafeHtml = (value, fallback) => {
            const raw = (value || '').trim();
            if (!raw) return fallback;
            const withBreaks = raw.replace(/\r?\n/g, '<br>');
            return sanitizeHtml(withBreaks);
        };

        const health = {
            intro: toSafeHtml(
                settings.health_intro,
                'This page is where I share personal health updates, current conditions, treatment progress, and notes.'
            ),
            current: toSafeHtml(settings.health_current, 'No updates yet.'),
            history: toSafeHtml(settings.health_history, 'No updates yet.'),
            notes: toSafeHtml(settings.health_notes, 'No notes yet.'),
            updatedAt: settings.health_updated_at || null,
        };

        res.render('pages/health', {
            title: `Health | ${settings.site_title}`,
            settings,
            health,
        });
    });

    // GET /healthz (machine health check)
    router.get('/healthz', (req, res) => {
        res.json({ status: 'ok', uptime: process.uptime() });
    });

    return router;
};

module.exports = { createPublicRouter };
