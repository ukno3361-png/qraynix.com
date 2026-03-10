/**
 * server/services/assistantService.js
 * Public-facing personality bot service.
 */

const { getDb } = require('../db');

const DEFAULT_DISCLAIMER = `⚠️ Advisory & Disclaimer
This interaction is being conducted on behalf of the one who's feeding me bullshittery. Please be advised that the content generated herein—including any jokes, anecdotes, or "facts"—is intended purely for entertainment purposes. Not all information provided is grounded in reality, and much of it is shared in the spirit of lighthearted fun. This is a consequence-free zone designed for play; please do not take the contents literally or use them as a basis for real-world decision-making. But at the end of the day, I more than anyone know, you will do whatever the fuck you want to do.`;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeHistory = (history) => {
    if (!Array.isArray(history)) return [];

    return history
        .filter((item) => item && (item.role === 'user' || item.role === 'assistant'))
        .slice(-8)
        .map((item) => ({
            role: item.role,
            content: String(item.content || '').trim().slice(0, 1200),
        }))
        .filter((item) => item.content.length > 0);
};

const normalizeForCompare = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

const stripDisclaimerFromHistory = (history, disclaimer) => {
    const normalizedDisclaimer = normalizeForCompare(disclaimer);
    if (!normalizedDisclaimer) return history;

    return history.filter((item) => {
        const normalizedContent = normalizeForCompare(item.content);
        if (!normalizedContent) return false;

        if (normalizedContent === normalizedDisclaimer) return false;
        if (normalizedContent.includes('⚠️ advisory & disclaimer')) return false;
        if (normalizedContent.includes('this interaction is being conducted on behalf of')) return false;

        return true;
    });
};

const normalizeGeminiModel = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return 'gemini-2.5-flash';

    const migrations = {
        'gemini-1.5-flash': 'gemini-2.5-flash',
        'gemini-1.5-pro': 'gemini-2.5-pro',
        'gemini-2.0-flash': 'gemini-2.5-flash',
        'gemini-2.0-flash-lite': 'gemini-2.5-flash-lite',
    };

    return migrations[raw] || raw;
};

const pageEnabled = (settings, key) => settings[key] !== 'false';

const createAssistantService = (settingsService) => {
    const getBotConfig = () => {
        const settings = settingsService.getAll();
        const ownerName = (settings.ai_chat_owner_name || settings.site_title || 'The Site Owner').trim();
        const disclaimerTemplate = (settings.ai_chat_disclaimer || DEFAULT_DISCLAIMER).trim();
        const settingsApiKey = String(settings.ai_chat_api_key || '').trim();
        const envApiKey = String(process.env.GEMINI_API_KEY || '').trim();

        return {
            enabled: settings.ai_chat_enabled !== 'false',
            ownerName,
            botName: (settings.ai_chat_bot_name || `${ownerName} Bot`).trim(),
            personality: String(settings.ai_chat_personality || '').trim(),
            model: normalizeGeminiModel(settings.ai_chat_model || process.env.GEMINI_MODEL),
            apiKey: settingsApiKey || envApiKey,
            disclaimer: disclaimerTemplate.replace(/\[Name\]/g, ownerName),
        };
    };

    const buildDailyContext = () => {
        const db = getDb();
        const settings = settingsService.getAll();

        const nowBlocks = pageEnabled(settings, 'show_now') ? db.prepare(`
            SELECT title, content
            FROM now_blocks
            WHERE visible = 1
            ORDER BY sort_order ASC, updated_at DESC, id DESC
            LIMIT 6
        `).all() : [];

        const latestEntries = db.prepare(`
            SELECT title, excerpt, content, created_at, published_at
            FROM entries
            WHERE status = 'published'
            ORDER BY COALESCE(published_at, created_at) DESC
            LIMIT 5
        `).all();

        const flashes = db.prepare(`
            SELECT preview_text, thought_text, created_at
            FROM thought_flashes
            WHERE visible = 1
            ORDER BY sort_order ASC, updated_at DESC, id DESC
            LIMIT 4
        `).all();

        const habits = pageEnabled(settings, 'show_habits') ? db.prepare(`
            SELECT name, description
            FROM habits
            WHERE visible = 1
            ORDER BY sort_order ASC, updated_at DESC, id DESC
            LIMIT 5
        `).all() : [];

        const music = pageEnabled(settings, 'show_music') ? db.prepare(`
            SELECT title, artist, album, notes
            FROM music_tracks
            WHERE visible = 1
            ORDER BY sort_order ASC, updated_at DESC, id DESC
            LIMIT 5
        `).all() : [];

        const health = pageEnabled(settings, 'show_health')
            ? {
                current: String(settings.health_current || '').trim(),
                notes: String(settings.health_notes || '').trim(),
            }
            : { current: '', notes: '' };

        return {
            nowBlocks,
            latestEntries,
            flashes,
            habits,
            music,
            health,
            excludedSources: ['future_messages'],
        };
    };

    const formatContext = (context) => {
        const nowSummary = context.nowBlocks.length
            ? context.nowBlocks.map((item) => `${item.title}: ${String(item.content || '').slice(0, 180)}`).join('\n')
            : 'No current now-block updates.';

        const entrySummary = context.latestEntries.length
            ? context.latestEntries
                .map((entry) => {
                    const when = (entry.published_at || entry.created_at || '').slice(0, 10) || 'unknown-date';
                    const body = String(entry.excerpt || entry.content || '').replace(/\s+/g, ' ').slice(0, 220);
                    return `${when} — ${entry.title}: ${body}`;
                })
                .join('\n')
            : 'No published entry history yet.';

        const flashSummary = context.flashes.length
            ? context.flashes
                .map((item) => `${String(item.preview_text || 'Flash')}: ${String(item.thought_text || '').replace(/\s+/g, ' ').slice(0, 180)}`)
                .join('\n')
            : 'No thought flash context yet.';

        const habitSummary = context.habits.length
            ? context.habits
                .map((habit) => `${habit.name}: ${String(habit.description || '').replace(/\s+/g, ' ').slice(0, 150)}`)
                .join('\n')
            : 'No public habit tracker context yet.';

        const musicSummary = context.music.length
            ? context.music
                .map((track) => `${track.title}${track.artist ? ` — ${track.artist}` : ''}: ${String(track.notes || '').replace(/\s+/g, ' ').slice(0, 120)}`)
                .join('\n')
            : 'No public music notes yet.';

        const healthSummary = [context.health.current, context.health.notes]
            .filter(Boolean)
            .map((value) => String(value).replace(/\s+/g, ' ').slice(0, 220))
            .join(' | ') || 'No public health summary available.';

        const excludedSummary = Array.isArray(context.excludedSources) && context.excludedSources.length
            ? context.excludedSources.join(', ')
            : 'none';

        return `Now Updates:\n${nowSummary}\n\nRecent Published Entries:\n${entrySummary}\n\nRecent Thought Flashes:\n${flashSummary}\n\nPublic Habits:\n${habitSummary}\n\nPublic Music:\n${musicSummary}\n\nPublic Health:\n${healthSummary}\n\nExcluded Sources (do not use):\n${excludedSummary}`;
    };

    const buildSystemPrompt = (config, contextBlock) => {
        const personalityBlock = config.personality
            ? `Personality Instructions (from dashboard):\n${config.personality}\n\n`
            : '';

        return `
You are ${config.botName}, an AI bot chatting with visitors on ${config.ownerName}'s site.

${personalityBlock}Use only the provided public site context for factual claims.
If context is missing, say you're not sure instead of inventing facts.

Site Context (public/trusted):
${contextBlock}
`.trim();
    };

    const buildFallbackReply = (message, config, context) => {
        const lower = message.toLowerCase();
        const nowTop = context.nowBlocks.slice(0, 3);
        const entriesTop = context.latestEntries.slice(0, 2);

        if (/today|now|doing|up to/.test(lower) && (nowTop.length || entriesTop.length)) {
            const nowLine = nowTop.length
                ? `Right now, ${config.ownerName} seems focused on ${nowTop.map((item) => item.title).join(', ')}.`
                : '';

            const entryLine = entriesTop.length
                ? `Latest journal notes: ${entriesTop.map((entry) => `“${entry.title}”`).join(' and ')}.`
                : '';

            return [nowLine, entryLine, 'That is the freshest signal I have from the site logs.'].filter(Boolean).join(' ');
        }

        return `${config.botName} is online. I can chat about public updates from entries, now activity, thought flashes, habits, music, and health notes. Future letters are excluded from my context.`;
    };

    const chatWithModel = async ({ config, message, history, contextBlock }) => {
        const apiKey = config.apiKey;
        if (!apiKey) return null;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        try {
            const geminiMessages = [
                ...history.map((item) => ({
                    role: item.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: item.content }],
                })),
                { role: 'user', parts: [{ text: message }] },
            ];

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    systemInstruction: {
                        role: 'system',
                        parts: [{ text: buildSystemPrompt(config, contextBlock) }],
                    },
                    contents: geminiMessages,
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 320,
                    },
                }),
                signal: controller.signal,
            });

            if (!response.ok) return null;

            const data = await response.json();
            const text = String(
                data?.candidates?.[0]?.content?.parts
                    ?.map((part) => String(part?.text || ''))
                    .join('') || ''
            ).trim();
            return text || null;
        } catch (_err) {
            return null;
        } finally {
            clearTimeout(timeout);
        }
    };

    const chat = async ({ message, history = [] }) => {
        const config = getBotConfig();
        if (!config.enabled) {
            const err = new Error('AI chat is disabled');
            err.status = 404;
            throw err;
        }

        const cleanMessage = String(message || '').trim().slice(0, 3000);
        if (!cleanMessage) {
            const err = new Error('Message is required');
            err.status = 400;
            throw err;
        }

        const safeHistory = stripDisclaimerFromHistory(normalizeHistory(history), config.disclaimer);
        const context = buildDailyContext();
        const contextBlock = formatContext(context);

        let reply = await chatWithModel({
            config,
            message: cleanMessage,
            history: safeHistory,
            contextBlock,
        });

        if (!reply) {
            reply = buildFallbackReply(cleanMessage, config, context);
        }

        return {
            reply: reply.slice(0, clamp(reply.length, 1, 6000)),
            botName: config.botName,
            disclaimer: config.disclaimer,
        };
    };

    const testConnection = async ({ model, apiKey } = {}) => {
        const base = getBotConfig();
        const runtimeConfig = {
            ...base,
            model: normalizeGeminiModel(model || base.model),
            apiKey: String(apiKey || base.apiKey || '').trim(),
        };

        if (!runtimeConfig.apiKey) {
            const err = new Error('Gemini API key is missing');
            err.status = 400;
            throw err;
        }

        const contextBlock = 'Connection test for dashboard configuration.';
        const reply = await chatWithModel({
            config: runtimeConfig,
            message: 'Reply with a short confirmation that the model is reachable.',
            history: [],
            contextBlock,
        });

        if (!reply) {
            const err = new Error('Unable to reach Gemini. Check API key and model.');
            err.status = 400;
            throw err;
        }

        return {
            success: true,
            model: runtimeConfig.model,
            message: `Connected successfully (${runtimeConfig.model})`,
            replyPreview: reply.slice(0, 120),
        };
    };

    const autocomplete = async ({ context }) => {
        const config = getBotConfig();
        const text = String(context || '').trim().slice(-600);
        if (!text || !config.apiKey) return { suggestion: '' };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
            const model = normalizeGeminiModel(config.model)
                .replace('pro', 'flash-lite')
                .replace(/^gemini-2\.5-flash$/, 'gemini-2.5-flash-lite');

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: {
                            role: 'system',
                            parts: [{ text: 'You are an inline text autocomplete engine. Given the text so far, output ONLY the natural continuation — a few words to one sentence. Do not repeat the input. Do not explain. Do not add quotes or punctuation that was not started. Just the continuation text.' }],
                        },
                        contents: [{ role: 'user', parts: [{ text }] }],
                        generationConfig: { temperature: 0.3, maxOutputTokens: 60 },
                    }),
                    signal: controller.signal,
                },
            );

            if (!response.ok) return { suggestion: '' };

            const data = await response.json();
            const raw = String(
                data?.candidates?.[0]?.content?.parts?.map((p) => String(p?.text || '')).join('') || '',
            ).trim();

            return { suggestion: raw.slice(0, 200) };
        } catch (_err) {
            return { suggestion: '' };
        } finally {
            clearTimeout(timeout);
        }
    };

    return { getBotConfig, chat, testConnection, autocomplete };
};

module.exports = { createAssistantService, DEFAULT_DISCLAIMER };
