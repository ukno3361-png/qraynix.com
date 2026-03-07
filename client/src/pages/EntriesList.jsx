/**
 * client/src/pages/EntriesList.jsx
 * Entries listing with search, filter, and bulk actions.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { entries as entriesApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function EntriesList() {
    const [data, setData] = useState({ entries: [], pagination: {} });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const toast = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (status) params.status = status;
            if (search) params.search = search;
            const result = await entriesApi.list(params);
            setData(result);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [page, status, search, toast]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (id, title) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
        try {
            await entriesApi.remove(id);
            toast.success('Entry deleted');
            load();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handlePublish = async (id) => {
        try {
            await entriesApi.publish(id);
            toast.success('Entry published');
            load();
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Entries</h1>
                <Link to="/admin/entries/new" className="btn btn-primary">✚ New Entry</Link>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
                    <span className="search-icon">⌕</span>
                    <input
                        type="text"
                        placeholder="Search entries..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <select className="form-select" style={{ width: '150px' }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                    <option value="">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="private">Private</option>
                </select>
            </div>

            {/* Entries Table */}
            {loading ? (
                <div className="page-loader"><div className="spinner spinner-lg"></div></div>
            ) : data.entries.length > 0 ? (
                <>
                    <div className="table-scroll">
                        <table className="data-table entries-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Tags</th>
                                    <th>Words</th>
                                    <th>Date</th>
                                    <th style={{ width: '120px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.entries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td><Link to={`/admin/entries/${entry.id}/edit`} className="entry-title-cell">{entry.title}</Link></td>
                                        <td><span className={`status-badge status-${entry.status}`}><span className="status-dot" />{entry.status}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                                {(entry.tags || []).map((t) => <span key={t.id} className="tag-chip">{t.name}</span>)}
                                            </div>
                                        </td>
                                        <td>{entry.word_count || 0}</td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--text-faint)' }}>{new Date(entry.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                {entry.status === 'draft' && (
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handlePublish(entry.id)}>Publish</button>
                                                )}
                                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(entry.id, entry.title)}>✕</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {data.pagination?.totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="btn btn-secondary btn-sm" disabled={!data.pagination.hasPrev} onClick={() => setPage(page - 1)}>← Previous</button>
                            <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: 'var(--text-faint)' }}>
                                Page {data.pagination.page} of {data.pagination.totalPages}
                            </span>
                            <button className="btn btn-secondary btn-sm" disabled={!data.pagination.hasNext} onClick={() => setPage(page + 1)}>Next →</button>
                        </div>
                    )}
                </>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">✦</div>
                        <div className="empty-title">{search ? 'No results' : 'No entries yet'}</div>
                        <div className="empty-text">{search ? 'Try a different search.' : 'Create your first journal entry.'}</div>
                        {!search && <Link to="/admin/entries/new" className="btn btn-primary">Create Entry</Link>}
                    </div>
                </div>
            )}
        </div>
    );
}
