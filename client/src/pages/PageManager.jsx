/**
 * client/src/pages/PageManager.jsx
 * Visual page-visibility manager — toggle public pages on/off.
 */
import React, { useState, useEffect } from 'react';
import { settings as settingsApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';

const PAGES = [
    { key: 'show_timeline', label: 'Timeline', icon: '◇', href: '/timeline', desc: 'Chronological life events and milestones' },
    { key: 'show_now', label: 'Now', icon: '◈', href: '/now', desc: 'What you\'re currently focused on' },
    { key: 'show_future', label: 'Future', icon: '⟡', href: '/future', desc: 'Letters and goals for your future self' },
    { key: 'show_music', label: 'Music', icon: '♫', href: '/music', desc: 'Music collection and playlists' },
    { key: 'show_entertainment', label: 'Entertainment', icon: 'ᛊ', href: '/entertainment', desc: 'Reviews for movies, shows, games, and more' },
    { key: 'show_habits', label: 'Habit Tracker', icon: '▣', href: '/habit-tracker', desc: 'Daily habit streaks and progress' },
    { key: 'show_livecam', label: 'Live Cam', icon: '◉', href: '/live-cam', desc: 'Live camera stream embed' },
    { key: 'show_health', label: 'Health', icon: '✧', href: '/health', desc: 'Personal health updates and notes' },
    { key: 'show_thought_flash', label: 'Thought Flash', icon: 'ᛃ', href: '/thought-flash', desc: 'Quick micro-thoughts and reflections' },
];

export default function PageManager() {
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        (async () => {
            try { setForm(await settingsApi.get()); }
            catch (err) { toast.error(err.message); }
            finally { setLoading(false); }
        })();
    }, [toast]);

    const toggle = async (key) => {
        const next = form[key] === 'true' ? 'false' : 'true';
        setForm((prev) => ({ ...prev, [key]: next }));
        try {
            await settingsApi.update({ [key]: next });
            toast.success(`${next === 'true' ? 'Enabled' : 'Disabled'}`);
        } catch (err) {
            setForm((prev) => ({ ...prev, [key]: form[key] }));
            toast.error(err.message);
        }
    };

    if (loading) return <div className="page-loader"><div className="spinner spinner-lg"></div></div>;

    const enabledCount = PAGES.filter((p) => form[p.key] === 'true').length;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Pages</h1>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-faint)' }}>
                    {enabledCount} of {PAGES.length} active
                </span>
            </div>

            <div className="pm-grid">
                {PAGES.map((page) => {
                    const on = form[page.key] === 'true';
                    return (
                        <div
                            key={page.key}
                            className={`pm-card ${on ? 'pm-on' : 'pm-off'}`}
                        >
                            <div className="pm-card-top">
                                <span className="pm-icon">{page.icon}</span>
                                <button
                                    className={`toggle-switch ${on ? 'on' : ''}`}
                                    onClick={() => toggle(page.key)}
                                    aria-label={`Toggle ${page.label}`}
                                />
                            </div>
                            <div className="pm-card-body">
                                <div className="pm-label">{page.label}</div>
                                <div className="pm-desc">{page.desc}</div>
                            </div>
                            <div className="pm-card-foot">
                                <span className={`pm-status ${on ? 'pm-status-on' : 'pm-status-off'}`}>
                                    {on ? '● Live' : '○ Hidden'}
                                </span>
                                <a
                                    href={page.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="pm-visit"
                                    style={{ opacity: on ? 1 : 0.35, pointerEvents: on ? 'auto' : 'none' }}
                                >
                                    Visit ↗
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
