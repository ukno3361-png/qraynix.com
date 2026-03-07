/**
 * client/src/pages/Dashboard.jsx
 * Admin dashboard — stats, recent entries, quick actions.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { entries as entriesApi, settings as settingsApi, entertainment as entertainmentApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [recent, setRecent] = useState([]);
    const [aiEnabled, setAiEnabled] = useState(true);
    const [aiSaving, setAiSaving] = useState(false);
    const [entStats, setEntStats] = useState(null);
    const [recentReviews, setRecentReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        const load = async () => {
            try {
                const [data, settings, entData, entStatsData] = await Promise.all([
                    entriesApi.list({ limit: 5 }),
                    settingsApi.get(),
                    entertainmentApi.list({ limit: 3, includeAll: 'true' }),
                    entertainmentApi.stats(),
                ]);
                setRecent(data.entries || []);
                setStats({
                    total: data.pagination?.total || 0,
                    published: (data.entries || []).filter(e => e.status === 'published').length,
                    drafts: (data.entries || []).filter(e => e.status === 'draft').length,
                    totalWords: (data.entries || []).reduce((sum, e) => sum + (e.word_count || 0), 0),
                });
                setAiEnabled(settings.ai_chat_enabled !== 'false');
                setRecentReviews(entData.reviews || []);
                setEntStats(entStatsData);
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
                    <div className="stat-label">Total Entries</div>
                    <div className="stat-value">{stats?.total || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Published</div>
                    <div className="stat-value">{stats?.published || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Drafts</div>
                    <div className="stat-value">{stats?.drafts || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Total Words</div>
                    <div className="stat-value">{(stats?.totalWords || 0).toLocaleString()}</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-grid">
                <Link to="/admin/health" className="quick-card">
                    <span className="quick-card-icon">✧</span>
                    <span className="quick-card-title">Health</span>
                    <span className="quick-card-desc">Update the public Health page content.</span>
                </Link>
                <Link to="/admin/future" className="quick-card">
                    <span className="quick-card-icon">⟡</span>
                    <span className="quick-card-title">Future</span>
                    <span className="quick-card-desc">Write and schedule messages to your future self.</span>
                </Link>
                <Link to="/admin/music" className="quick-card">
                    <span className="quick-card-icon">♫</span>
                    <span className="quick-card-title">Music</span>
                    <span className="quick-card-desc">Upload songs and publish your music player.</span>
                </Link>
                <Link to="/admin/thought-flash" className="quick-card">
                    <span className="quick-card-icon">ᛃ</span>
                    <span className="quick-card-title">Thought Flash</span>
                    <span className="quick-card-desc">Curate random media thoughts for the grid.</span>
                </Link>
                <Link to="/admin/habits" className="quick-card">
                    <span className="quick-card-icon">▣</span>
                    <span className="quick-card-title">Habit Tracker</span>
                    <span className="quick-card-desc">Manage habits and log daily progress.</span>
                </Link>
                <Link to="/admin/live-cam" className="quick-card">
                    <span className="quick-card-icon">◉</span>
                    <span className="quick-card-title">Live Cam</span>
                    <span className="quick-card-desc">Configure your IP camera stream.</span>
                </Link>
                <Link to="/admin/entertainment" className="quick-card">
                    <span className="quick-card-icon">ᛊ</span>
                    <span className="quick-card-title">Entertainment</span>
                    <span className="quick-card-desc">Review movies, shows, music, and more.</span>
                </Link>
            </div>

            {/* AI Toggle */}
            <div className="ai-toggle-card">
                <div className="ai-toggle-info">
                    <span className="ai-toggle-icon">☲</span>
                    <div>
                        <div className="ai-toggle-label">AI Chat Bot</div>
                        <div className="ai-toggle-status">Public chat widget &middot; {aiEnabled ? 'Active' : 'Disabled'}</div>
                    </div>
                </div>
                <button
                    type="button"
                    className={`toggle-switch ${aiEnabled ? 'on' : ''}`}
                    onClick={() => handleAiToggle(!aiEnabled)}
                    disabled={aiSaving}
                    aria-label="Toggle AI chat"
                />
            </div>

            {/* Entertainment Section */}
            {entStats && (
                <>
                    <div className="section-title">Entertainment Reviews</div>
                    <div className="stats-grid" style={{ marginBottom: '1rem' }}>
                        <div className="stat-card">
                            <div className="stat-label">Total Reviews</div>
                            <div className="stat-value">{entStats.total}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Published</div>
                            <div className="stat-value">{entStats.published}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Featured</div>
                            <div className="stat-value">{entStats.featured}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Avg Rating</div>
                            <div className="stat-value">{entStats.avgRating}/10</div>
                        </div>
                    </div>
                    {recentReviews.length > 0 && (
                        <div className="table-scroll">
                            <table className="data-table entries-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Type</th>
                                        <th>Rating</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentReviews.map((r) => (
                                        <tr key={r.id}>
                                            <td><span className="entry-title-cell">{r.title}</span></td>
                                            <td><span className="entertainment-type-chip">{r.type}</span></td>
                                            <td>{r.rating}/10</td>
                                            <td><span className={`status-badge status-${r.status}`}><span className="status-dot" />{r.status}</span></td>
                                            <td><Link to="/admin/entertainment" className="edit-link">Manage →</Link></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Recent Entries */}
            <div className="section-title">Recent Entries</div>
            {recent.length > 0 ? (
                <div className="table-scroll">
                    <table className="data-table entries-table">
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
                                    <td><span className="entry-title-cell">{entry.title}</span></td>
                                    <td><span className={`status-badge status-${entry.status}`}><span className="status-dot" />{entry.status}</span></td>
                                    <td>{entry.word_count || 0}</td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-faint)' }}>{new Date(entry.created_at).toLocaleDateString()}</td>
                                    <td><Link to={`/admin/entries/${entry.id}/edit`} className="edit-link">Edit →</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">✦</div>
                        <div className="empty-title">No entries yet</div>
                        <div className="empty-text">Start writing your first journal entry.</div>
                        <Link to="/admin/entries/new" className="btn btn-primary">Create Entry</Link>
                    </div>
                </div>
            )}
        </div>
    );
}
