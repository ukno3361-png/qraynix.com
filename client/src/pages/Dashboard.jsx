/**
 * client/src/pages/Dashboard.jsx
 * Admin dashboard — stats, recent entries, quick actions.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { entries as entriesApi, settings as settingsApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [recent, setRecent] = useState([]);
    const [aiEnabled, setAiEnabled] = useState(true);
    const [aiSaving, setAiSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        const load = async () => {
            try {
                const [data, settings] = await Promise.all([
                    entriesApi.list({ limit: 5 }),
                    settingsApi.get(),
                ]);
                setRecent(data.entries || []);
                setStats({
                    total: data.pagination?.total || 0,
                    published: (data.entries || []).filter(e => e.status === 'published').length,
                    drafts: (data.entries || []).filter(e => e.status === 'draft').length,
                    totalWords: (data.entries || []).reduce((sum, e) => sum + (e.word_count || 0), 0),
                });
                setAiEnabled(settings.ai_chat_enabled !== 'false');
            } catch (err) {
                toast.error(err.message || 'Dashboard load failed');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [toast]);

    const handleAiToggle = async (checked) => {
        const next = !!checked;
        setAiEnabled(next);
        setAiSaving(true);
        try {
            await settingsApi.update({ ai_chat_enabled: next ? 'true' : 'false' });
            toast.success(next ? 'AI chat enabled sitewide' : 'AI chat disabled sitewide');
        } catch (err) {
            setAiEnabled(!next);
            toast.error(err.message || 'Unable to update AI setting');
        } finally {
            setAiSaving(false);
        }
    };

    if (loading) return <div className="page-loader"><div className="spinner spinner-lg"></div></div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <Link to="/admin/entries/new" className="btn btn-primary">✚ New Entry</Link>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats?.total || 0}</div>
                    <div className="stat-label">Total Entries</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats?.published || 0}</div>
                    <div className="stat-label">Published</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats?.drafts || 0}</div>
                    <div className="stat-label">Drafts</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{(stats?.totalWords || 0).toLocaleString()}</div>
                    <div className="stat-label">Total Words</div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 className="card-title">Health</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Update the public Health page content from the dashboard.
                </p>
                <Link to="/admin/health" className="btn btn-secondary">Open Health Editor</Link>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 className="card-title">Future</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Write and schedule messages to your future self.
                </p>
                <Link to="/admin/future" className="btn btn-secondary">Open Future Manager</Link>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 className="card-title">Music</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Upload songs, set metadata, and publish your public music player.
                </p>
                <Link to="/admin/music" className="btn btn-secondary">Open Music Manager</Link>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 className="card-title">Thought Flash</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Curate random media thoughts for the public infinite-scroll grid and modal view.
                </p>
                <Link to="/admin/thought-flash" className="btn btn-secondary">Open Thought Flash Manager</Link>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 className="card-title">Habit Tracker</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Manage habits, log daily progress, and publish your tracker page.
                </p>
                <Link to="/admin/habits" className="btn btn-secondary">Open Habit Tracker</Link>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 className="card-title">Live Cam</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Configure your IP camera stream and public live cam information.
                </p>
                <Link to="/admin/live-cam" className="btn btn-secondary">Open Live Cam Settings</Link>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 className="card-title">AI Bot</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Configure the public chat popup, personality prompt, and mandatory disclaimer bubble.
                </p>
                <div className="form-group" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleAiToggle(!aiEnabled)}
                        disabled={aiSaving}
                    >
                        {aiSaving
                            ? 'Saving...'
                            : aiEnabled
                                ? 'Turn Off AI Sitewide'
                                : 'Turn On AI Sitewide'}
                    </button>
                    <span className="form-label" style={{ margin: 0 }}>
                        Status: {aiEnabled ? 'ON' : 'OFF'}
                    </span>
                </div>
                <Link to="/admin/ai-bot" className="btn btn-secondary">Open AI Bot Settings</Link>
            </div>

            {/* Recent Entries */}
            <div className="card">
                <h2 className="card-title">Recent Entries</h2>
                {recent.length > 0 ? (
                    <div className="table-scroll">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Words</th>
                                    <th>Created</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map((entry) => (
                                    <tr key={entry.id}>
                                        <td><strong>{entry.title}</strong></td>
                                        <td><span className={`status-badge status-${entry.status}`}>{entry.status}</span></td>
                                        <td>{entry.word_count || 0}</td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-faint)' }}>{new Date(entry.created_at).toLocaleDateString()}</td>
                                        <td><Link to={`/admin/entries/${entry.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">✦</div>
                        <div className="empty-title">No entries yet</div>
                        <div className="empty-text">Start writing your first journal entry.</div>
                        <Link to="/admin/entries/new" className="btn btn-primary">Create Entry</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
