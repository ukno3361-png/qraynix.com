/**
 * client/src/pages/TimelineManager.jsx
 * CRUD manager for timeline events.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { timeline as timelineApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import AutocompleteTextarea from '../components/AutocompleteTextarea.jsx';

const EMPTY = { title: '', description: '', event_date: '', category: 'life', icon: 'ᚱ', color: '#c9a84c', link_url: '', link_label: '' };
const RUNE_OPTIONS = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛞ', 'ᛟ'];

const normalizeRuneIcon = (value) => (RUNE_OPTIONS.includes(value) ? value : 'ᚱ');

export default function TimelineManager() {
    const [events, setEvents] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const load = useCallback(async () => {
        try {
            const data = await timelineApi.list();
            setEvents(data);
        } catch (err) { toast.error(err.message); }
        finally { setLoading(false); }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    const handleSave = async () => {
        try {
            const payload = {
                ...form,
                icon: normalizeRuneIcon(form.icon),
            };

            if (editing) {
                await timelineApi.update(editing, payload);
                toast.success('Event updated');
            } else {
                await timelineApi.create(payload);
                toast.success('Event created');
            }
            setForm(EMPTY); setEditing(null); load();
        } catch (err) { toast.error(err.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this event?')) return;
        await timelineApi.remove(id);
        toast.success('Deleted'); load();
    };

    const startEdit = (evt) => {
        setEditing(evt.id);
        setForm({
            ...evt,
            icon: normalizeRuneIcon(evt.icon),
        });
    };
    const cancelEdit = () => { setEditing(null); setForm(EMPTY); };

    if (loading) return <div className="page-loader"><div className="spinner spinner-lg"></div></div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Timeline</h1>
            </div>

            {/* Form */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 className="card-title">{editing ? 'Edit Event' : 'Add Event'}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Date</label>
                        <input className="form-input" type="date" value={form.event_date?.split('T')[0] || ''} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Description</label>
                        <AutocompleteTextarea className="form-textarea" rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                            <option value="life">Life</option>
                            <option value="work">Work</option>
                            <option value="travel">Travel</option>
                            <option value="creative">Creative</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Icon</label>
                        <select
                            className="form-select"
                            value={normalizeRuneIcon(form.icon)}
                            onChange={(e) => setForm({ ...form, icon: e.target.value })}
                        >
                            {RUNE_OPTIONS.map((rune) => (
                                <option key={rune} value={rune}>{rune}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button>
                    {editing && <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>}
                </div>
            </div>

            {/* Events List */}
            {events.length > 0 ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead><tr><th>Icon</th><th>Title</th><th>Date</th><th>Category</th><th>Actions</th></tr></thead>
                        <tbody>
                            {events.map((evt) => (
                                <tr key={evt.id}>
                                    <td style={{ fontSize: '1.3rem' }}>{evt.icon || '◇'}</td>
                                    <td><strong>{evt.title}</strong></td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-faint)' }}>{evt.event_date}</td>
                                    <td><span className="tag-chip">{evt.category}</span></td>
                                    <td>
                                        <button className="btn btn-ghost btn-sm" onClick={() => startEdit(evt)}>Edit</button>
                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(evt.id)}>✕</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card"><div className="empty-state"><div className="empty-icon">◇</div><div className="empty-title">No events</div></div></div>
            )}
        </div>
    );
}
