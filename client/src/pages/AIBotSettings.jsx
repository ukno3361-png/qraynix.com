/**
 * client/src/pages/AIBotSettings.jsx
 * Configure the public AI personality bot popup.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { settings as settingsApi, assistant as assistantApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';

const DEFAULT_DISCLAIMER = `⚠️ Advisory & Disclaimer
This interaction is being conducted on behalf of the one who's feeding me bullshittery. Please be advised that the content generated herein—including any jokes, anecdotes, or "facts"—is intended purely for entertainment purposes. Not all information provided is grounded in reality, and much of it is shared in the spirit of lighthearted fun. This is a consequence-free zone designed for play; please do not take the contents literally or use them as a basis for real-world decision-making. But at the end of the day, I more than anyone know, you will do whatever the fuck you want to do.`;

const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro',
    'gemini-flash-latest',
];

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

export default function AIBotSettings() {
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        const load = async () => {
            try {
                const loaded = await settingsApi.get();
                const migratedModel = normalizeGeminiModel(loaded.ai_chat_model);
                const next = { ...loaded, ai_chat_model: migratedModel };
                setForm(next);

                if (migratedModel !== (loaded.ai_chat_model || '')) {
                    await settingsApi.update({ ai_chat_model: migratedModel });
                }
            } catch (err) {
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [toast]);

    const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const ownerName = String(form.ai_chat_owner_name || form.site_title || 'Name');
    const disclaimerPreview = useMemo(
        () => String(form.ai_chat_disclaimer || DEFAULT_DISCLAIMER).replace(/\[Name\]/g, ownerName),
        [form.ai_chat_disclaimer, ownerName]
    );

    const save = async () => {
        setSaving(true);
        try {
            await settingsApi.update(form);
            toast.success('AI bot settings saved');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const testConnection = async () => {
        setTesting(true);
        try {
            const response = await assistantApi.testConnection({
                model: form.ai_chat_model || 'gemini-2.5-flash',
                apiKey: form.ai_chat_api_key || '',
            });
            toast.success(response?.message || 'Gemini connection successful');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setTesting(false);
        }
    };

    if (loading) return <div className="page-loader"><div className="spinner spinner-lg"></div></div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">AI Bot</h1>
                <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>

            <div className="settings-grid">
                <div className="card">
                    <h3 className="card-title">Bot Behavior</h3>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={form.ai_chat_enabled !== 'false'}
                                onChange={(e) => set('ai_chat_enabled', e.target.checked ? 'true' : 'false')}
                            />
                            <span className="form-label" style={{ margin: 0 }}>Enable popup on public pages</span>
                        </label>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Owner Name</label>
                        <input
                            className="form-input"
                            value={form.ai_chat_owner_name || ''}
                            onChange={(e) => set('ai_chat_owner_name', e.target.value)}
                            placeholder="Your name"
                        />
                        <div className="form-hint">Replaces [Name] in disclaimer text.</div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Bot Name</label>
                        <input
                            className="form-input"
                            value={form.ai_chat_bot_name || ''}
                            onChange={(e) => set('ai_chat_bot_name', e.target.value)}
                            placeholder="e.g. Qraynix Persona"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Personality Prompt</label>
                        <textarea
                            className="form-textarea"
                            rows={5}
                            value={form.ai_chat_personality || ''}
                            onChange={(e) => set('ai_chat_personality', e.target.value)}
                            placeholder="How should the bot sound and behave?"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Gemini Model</label>
                        <select
                            className="form-select"
                            value={form.ai_chat_model || 'gemini-2.5-flash'}
                            onChange={(e) => set('ai_chat_model', e.target.value)}>
                            {GEMINI_MODELS.map((model) => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Gemini API Key</label>
                        <input
                            className="form-input"
                            type="password"
                            value={form.ai_chat_api_key || ''}
                            onChange={(e) => set('ai_chat_api_key', e.target.value)}
                            placeholder="AIza..."
                            autoComplete="off"
                        />
                        <div className="form-hint">Saved in dashboard settings and used for chatbot responses.</div>
                        <div className="form-hint" style={{ marginTop: '0.35rem' }}>
                            If this field is empty, the server falls back to <strong>GEMINI_API_KEY</strong> from your <strong>.env</strong> file.
                        </div>
                        <div className="form-hint" style={{ marginTop: '0.35rem' }}>
                            Add to <strong>.env</strong>: <strong>GEMINI_API_KEY=your_key_here</strong> and optionally <strong>GEMINI_MODEL=gemini-2.5-flash</strong>.
                        </div>
                        <div style={{ marginTop: '0.75rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={testConnection} disabled={testing}>
                                {testing ? 'Testing...' : 'Test Connection'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 className="card-title">First Bubble Disclaimer</h3>
                    <div className="form-group">
                        <label className="form-label">Disclaimer Template</label>
                        <textarea
                            className="form-textarea"
                            rows={10}
                            value={form.ai_chat_disclaimer || DEFAULT_DISCLAIMER}
                            onChange={(e) => set('ai_chat_disclaimer', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Preview</label>
                        <div style={{
                            border: '1px solid var(--border)',
                            borderRadius: 10,
                            padding: '0.8rem',
                            whiteSpace: 'pre-wrap',
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-elevated)',
                            lineHeight: 1.5,
                        }}>
                            {disclaimerPreview}
                        </div>
                    </div>

                    <a href="/" className="btn btn-secondary" target="_blank" rel="noreferrer">Open Public Site ↗</a>
                </div>
            </div>
        </div>
    );
}
