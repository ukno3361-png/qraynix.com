/**
 * client/src/api.js
 * Centralized API client for the admin SPA.
 * All requests go through this module for consistent error handling.
 */

const API_BASE = '/api';
const AUTH_BASE = '/auth';

/**
 * request — generic fetch wrapper with error handling.
 * @param {string} url - Full URL path
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>}
 */
const request = async (url, options = {}) => {
    const config = {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    };

    // Don't set Content-Type for FormData (browser sets multipart boundary)
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    const res = await fetch(url, config);

    if (res.status === 401) {
        // Redirect to login on auth failure
        window.location.href = '/login';
        throw new Error('Session expired');
    }

    const contentType = String(res.headers.get('content-type') || '').toLowerCase();
    const rawText = await res.text();
    let data = null;

    if (rawText) {
        try {
            data = JSON.parse(rawText);
        } catch (_err) {
            data = null;
        }
    }

    if (!res.ok) {
        const serverMessage = data?.error?.message || data?.message;
        if (serverMessage) throw new Error(serverMessage);
        if (res.status === 413) {
            throw new Error('Upload too large (413). Reduce file size or increase upload limits on the server/proxy (e.g., nginx client_max_body_size).');
        }
        if (contentType.includes('text/html')) {
            throw new Error(`Request failed (${res.status}) — server returned HTML instead of JSON`);
        }
        throw new Error(`Request failed (${res.status})`);
    }

    if (data === null && rawText) {
        throw new Error('Server returned an unexpected non-JSON response');
    }

    return data;
};

// ── Auth ──
export const auth = {
    me: () => request(`${AUTH_BASE}/me`),
    login: (identifier, password) =>
        request(`${AUTH_BASE}/login`, { method: 'POST', body: JSON.stringify({ identifier, password }) }),
    signup: (username, email, password) =>
        request(`${AUTH_BASE}/signup`, { method: 'POST', body: JSON.stringify({ username, email, password }) }),
    logout: () => request(`${AUTH_BASE}/logout`, { method: 'POST' }),
};

// ── Entries ──
export const entries = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`${API_BASE}/entries${qs ? '?' + qs : ''}`);
    },
    get: (id) => request(`${API_BASE}/entries/${id}`),
    create: (data) => request(`${API_BASE}/entries`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`${API_BASE}/entries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id) => request(`${API_BASE}/entries/${id}`, { method: 'DELETE' }),
    publish: (id) => request(`${API_BASE}/entries/${id}/publish`, { method: 'POST' }),
    unpublish: (id) => request(`${API_BASE}/entries/${id}/unpublish`, { method: 'POST' }),
    versions: (id) => request(`${API_BASE}/entries/${id}/versions`),
    updateTags: (id, tagIds) => request(`${API_BASE}/entries/${id}/tags`, { method: 'PUT', body: JSON.stringify({ tagIds }) }),
};

// ── Media ──
export const media = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`${API_BASE}/media${qs ? '?' + qs : ''}`);
    },
    upload: (files, entryId) => {
        const formData = new FormData();
        Array.from(files).forEach((f) => formData.append('files', f));
        if (entryId) formData.append('entry_id', entryId);
        return request(`${API_BASE}/media/upload`, { method: 'POST', body: formData });
    },
    update: (id, data) => request(`${API_BASE}/media/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id) => request(`${API_BASE}/media/${id}`, { method: 'DELETE' }),
};

// ── Tags ──
export const tags = {
    list: () => request(`${API_BASE}/tags`),
    create: (data) => request(`${API_BASE}/tags`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`${API_BASE}/tags/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id) => request(`${API_BASE}/tags/${id}`, { method: 'DELETE' }),
};

// ── Timeline ──
export const timeline = {
    list: () => request(`${API_BASE}/timeline`),
    create: (data) => request(`${API_BASE}/timeline`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`${API_BASE}/timeline/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id) => request(`${API_BASE}/timeline/${id}`, { method: 'DELETE' }),
    reorder: (items) => request(`${API_BASE}/timeline/reorder`, { method: 'POST', body: JSON.stringify({ items }) }),
};

// ── Now ──
export const now = {
    list: () => request(`${API_BASE}/now`),
    create: (data) => request(`${API_BASE}/now`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`${API_BASE}/now/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id) => request(`${API_BASE}/now/${id}`, { method: 'DELETE' }),
    reorder: (items) => request(`${API_BASE}/now/reorder`, { method: 'POST', body: JSON.stringify({ items }) }),
};

// ── Future ──
export const future = {
    list: () => request(`${API_BASE}/future`),
    create: (data) => request(`${API_BASE}/future`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`${API_BASE}/future/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id) => request(`${API_BASE}/future/${id}`, { method: 'DELETE' }),
};

// ── Music ──
export const music = {
    list: (includeHidden = true) => request(`${API_BASE}/music?includeHidden=${includeHidden}`),
    create: (data) => request(`${API_BASE}/music`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`${API_BASE}/music/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id) => request(`${API_BASE}/music/${id}`, { method: 'DELETE' }),
};

// ── Habits ──
export const habits = {
    list: (includeHidden = true) => request(`${API_BASE}/habits?includeHidden=${includeHidden}`),
    create: (data) => request(`${API_BASE}/habits`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`${API_BASE}/habits/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id) => request(`${API_BASE}/habits/${id}`, { method: 'DELETE' }),
    reorder: (items) => request(`${API_BASE}/habits/reorder`, { method: 'POST', body: JSON.stringify({ items }) }),
    upsertLog: (id, date, data) => request(`${API_BASE}/habits/${id}/log/${date}`, { method: 'PUT', body: JSON.stringify(data) }),
    logs: (id, params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`${API_BASE}/habits/${id}/logs${qs ? '?' + qs : ''}`);
    },
};

// ── Thought Flash ──
export const thoughtFlash = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`${API_BASE}/thought-flash${qs ? '?' + qs : ''}`);
    },
    create: (data) => request(`${API_BASE}/thought-flash`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`${API_BASE}/thought-flash/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id) => request(`${API_BASE}/thought-flash/${id}`, { method: 'DELETE' }),
    reorder: (items) => request(`${API_BASE}/thought-flash/reorder`, { method: 'POST', body: JSON.stringify({ items }) }),
};

// ── Entertainment ──
export const entertainment = {
    list: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return request(`${API_BASE}/entertainment${qs ? '?' + qs : ''}`);
    },
    get: (id) => request(`${API_BASE}/entertainment/${id}`),
    create: (data) => request(`${API_BASE}/entertainment`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`${API_BASE}/entertainment/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (id) => request(`${API_BASE}/entertainment/${id}`, { method: 'DELETE' }),
    stats: () => request(`${API_BASE}/entertainment/stats`),
    itunesSearch: (term, media = 'music', limit = 5) => {
        const qs = new URLSearchParams({ term, media, limit: String(limit) }).toString();
        return request(`${API_BASE}/entertainment/itunes-search?${qs}`);
    },
};

// ── Account ──
export const account = {
    get: () => request(`${API_BASE}/account`),
    update: (data) => request(`${API_BASE}/account`, { method: 'PATCH', body: JSON.stringify(data) }),
    uploadAvatar: (file) => {
        const formData = new FormData();
        formData.append('avatar', file);
        return request(`${API_BASE}/account/avatar`, { method: 'POST', body: formData });
    },
    changePassword: (currentPassword, newPassword) =>
        request(`${API_BASE}/account/password`, { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
};

// ── Settings ──
export const settings = {
    get: () => request(`${API_BASE}/settings`),
    update: (data) => request(`${API_BASE}/settings`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ── Assistant ──
export const assistant = {
    testConnection: (data) => request(`${API_BASE}/assistant/test`, { method: 'POST', body: JSON.stringify(data) }),
    autocomplete: (data) => request(`${API_BASE}/assistant/autocomplete`, { method: 'POST', body: JSON.stringify(data) }),
};

// ── DB Tools ──
export const dbTools = {
    status: () => request(`${API_BASE}/db-tools/status`),
    files: () => request(`${API_BASE}/db-tools/files`),
    cloneMigrate: (data) => request(`${API_BASE}/db-tools/clone-migrate`, { method: 'POST', body: JSON.stringify(data) }),
    migrateInPlace: (data) => request(`${API_BASE}/db-tools/migrate-in-place`, { method: 'POST', body: JSON.stringify(data) }),
};

// ── Search ──
export const search = {
    query: (q, limit) => {
        const qs = new URLSearchParams({ q, ...(limit && { limit }) }).toString();
        return request(`${API_BASE}/search?${qs}`);
    },
};

// ── Dashboard Stats ──
export const dashboard = {
    stats: async () => {
        const [entryData, mediaData, settingsData] = await Promise.all([
            request(`${API_BASE}/entries?limit=1`),
            request(`${API_BASE}/media?limit=1`),
            request(`${API_BASE}/settings`),
        ]);
        return {
            totalEntries: entryData.pagination?.total || 0,
            totalMedia: mediaData.total || 0,
            settings: settingsData,
        };
    },
};
