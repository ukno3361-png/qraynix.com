/**
 * client/src/pages/Dashboard.jsx
 * Admin dashboard — stats, recent entries, quick actions.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { entries as entriesApi } from '../api.js';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await entriesApi.list({ limit: 5 });
                setRecent(data.entries || []);
                setStats({
                    total: data.pagination?.total || 0,
                    published: (data.entries || []).filter(e => e.status === 'published').length,
                    drafts: (data.entries || []).filter(e => e.status === 'draft').length,
                    totalWords: (data.entries || []).reduce((sum, e) => sum + (e.word_count || 0), 0),
                });
            } catch (err) {
                console.error('Dashboard load error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

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

            {/* Recent Entries */}
            <div className="card">
                <h2 className="card-title">Recent Entries</h2>
                {recent.length > 0 ? (
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
