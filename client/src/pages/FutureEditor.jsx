/**
 * client/src/pages/FutureEditor.jsx
 * Manage letters/messages to future self.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { future as futureApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';

const EMPTY = {
    title: '',
    message: '',
    mood: '',
    target_date: '',
    is_public: true,
    is_pinned: false,
};

const toDateOnly = (value) => {
    if (!value) return '';
    return String(value).slice(0, 10);
};

const isLocked = (targetDate) => {
    if (!targetDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(targetDate);
    date.setHours(0, 0, 0, 0);
    return date > today;
};

export default function FutureEditor() {
    const [items, setItems] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState('all');
    const toast = useToast();

    const load = useCallback(async () => {
        try {
            setItems(await futureApi.list());
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            if (filter === 'all') return true;
            if (filter === 'open') return !isLocked(item.target_date);
            if (filter === 'locked') return isLocked(item.target_date);
            if (filter === 'public') return Boolean(item.is_public);
            if (filter === 'private') return !item.is_public;
            return true;
        });
    }, [items, filter]);

    const stats = useMemo(() => {
        const total = items.length;
        const locked = items.filter((item) => isLocked(item.target_date)).length;
        const pinned = items.filter((item) => item.is_pinned).length;
        return { total, locked, pinned };
    }, [items]);

    const startEdit = (item) => {
        setEditingId(item.id);
        setForm({
            title: item.title || '',
            message: item.message || '',
            mood: item.mood || '',
            target_date: toDateOnly(item.target_date),
            is_public: Boolean(item.is_public),
            is_pinned: Boolean(item.is_pinned),
        });
    };

    const resetForm = () => {
        setEditingId(null);
        setForm(EMPTY);
    };

    const save = async () => {
        setSaving(true);
        try {
            const payload = {
                ...form,
                title: form.title.trim() || 'Untitled future letter',
                message: form.message.trim(),
                mood: form.mood.trim(),
                target_date: form.target_date || null,
            };

            if (!payload.message) {
                toast.error('Message cannot be empty');
                setSaving(false);
                return;
            }

            if (editingId) {
                await futureApi.update(editingId, payload);
                toast.success('Future message updated');
            } else {
                await futureApi.create(payload);
                toast.success('Future message created');
            }

            resetForm();
            await load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id) => {
        if (!confirm('Delete this future message?')) return;
        try {
            await futureApi.remove(id);
            toast.success('Deleted');
            await load();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const togglePinned = async (item) => {
        try {
            await futureApi.update(item.id, { is_pinned: !item.is_pinned });
            await load();
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (loading) return <div className="page-loader"><div className="spinner spinner-lg"></div></div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Future</h1>
                <a href="/future" className="btn btn-secondary" target="_blank" rel="noreferrer">View Public Page ↗</a>
            </div>

            <div className="stats-grid">
                <div className="stat-card"><div className="stat-value">{stats.total}</div><div className="stat-label">Messages</div></div>
                <div className="stat-card"><div className="stat-value">{stats.locked}</div><div className="stat-label">Locked</div></div>
                <div className="stat-card"><div className="stat-value">{stats.pinned}</div><div className="stat-label">Pinned</div></div>
            </div>

            <div className="card" style={{ marginBottom: '1.2rem' }}>
                <h3 className="card-title">{editingId ? 'Edit Message' : 'Write Message to Future Self'}</h3>

                <div className="form-group">
                    <label className="form-label">Title</label>
                    <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Letter title" />
                </div>

                <div className="form-group">
                    <label className="form-label">Message</label>
                    <textarea className="form-textarea" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Write to your future self..." />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Mood / Theme</label>
                        <input className="form-input" value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })} placeholder="hopeful, focused, uncertain..." />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Target Date (optional unlock)</label>
                        <input className="form-input" type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} />
                        <span className="form-label" style={{ margin: 0 }}>Public</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.is_pinned} onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })} />
                        <span className="form-label" style={{ margin: 0 }}>Pin to top</span>
                    </label>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : (editingId ? 'Update' : 'Create')}</button>
                    {editingId && <button className="btn btn-secondary" onClick={resetForm}>Cancel</button>}
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[
                        ['all', 'All'],
                        ['open', 'Open'],
                        ['locked', 'Locked'],
                        ['public', 'Public'],
                        ['private', 'Private'],
                    ].map(([key, label]) => (
                        <button key={key} className={`btn btn-sm ${filter === key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(key)}>{label}</button>
                    ))}
                </div>
            </div>

            {filteredItems.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">⟡</div>
                        <div className="empty-title">No future messages</div>
                        <div className="empty-text">Write one above to begin your timeline with future self.</div>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    {filteredItems.map((item) => {
                        const locked = isLocked(item.target_date);
                        return (
                            <div key={item.id} className="card" style={{ borderStyle: locked ? 'dashed' : 'solid', borderColor: item.is_pinned ? 'rgba(201, 168, 76, 0.5)' : undefined }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <strong>{item.title}</strong>
                                            {item.is_pinned ? <span className="tag-chip">Pinned</span> : null}
                                            {locked ? <span className="tag-chip">Locked</span> : <span className="tag-chip">Open</span>}
                                            {!item.is_public ? <span className="tag-chip">Private</span> : null}
                                            {item.mood ? <span className="tag-chip">{item.mood}</span> : null}
                                        </div>
                                        <p style={{ marginTop: '0.4rem', marginBottom: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>{item.message}</p>
                                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-faint)' }}>
                                            Target: {item.target_date ? new Date(item.target_date).toLocaleDateString() : 'None'} · Updated: {new Date(item.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => togglePinned(item)}>{item.is_pinned ? 'Unpin' : 'Pin'}</button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => startEdit(item)}>Edit</button>
                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => remove(item.id)}>Delete</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
