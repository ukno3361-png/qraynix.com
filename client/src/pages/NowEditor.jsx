/**
 * client/src/pages/NowEditor.jsx
 * Manage "Now" blocks — reorder, edit, toggle visibility.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { now as nowApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import AutocompleteTextarea from '../components/AutocompleteTextarea.jsx';

const EMPTY = { title: '', content: '', icon: '', sort_order: '', visible: true };

export default function NowEditor() {
    const [blocks, setBlocks] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const load = useCallback(async () => {
        try { setBlocks(await nowApi.list()); }
        catch (err) { toast.error(err.message); }
        finally { setLoading(false); }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    const handleSave = async () => {
        try {
            const payload = {
                ...form,
                ...(form.sort_order !== '' ? { sort_order: parseInt(form.sort_order, 10) || 0 } : {}),
            };

            if (editing) {
                await nowApi.update(editing, payload);
                toast.success('Updated');
            } else {
                await nowApi.create(payload);
                toast.success('Created');
            }
            setForm(EMPTY); setEditing(null); load();
        } catch (err) { toast.error(err.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this block?')) return;
        await nowApi.remove(id);
        toast.success('Deleted'); load();
    };

    const toggleVisibility = async (block) => {
        await nowApi.update(block.id, { visible: block.visible ? 0 : 1 });
        load();
    };

    if (loading) return <div className="page-loader"><div className="spinner spinner-lg"></div></div>;

    return (
        <div>
            <div className="page-header"><h1 className="page-title">Now Page</h1></div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 className="card-title">{editing ? 'Edit Block' : 'Add Block'}</h3>
                <div className="form-group">
                    <label className="form-label">Title</label>
                    <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="form-group">
                    <label className="form-label">Content</label>
                    <AutocompleteTextarea className="form-textarea" rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Icon (emoji)</label>
                        <input className="form-input" value={form.icon || ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🎯" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Sort Order</label>
                        <input className="form-input" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} placeholder="Auto (latest first)" />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button>
                    {editing && <button className="btn btn-secondary" onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancel</button>}
                </div>
            </div>

            {blocks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {blocks.map((block) => (
                        <div key={block.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: block.visible ? 1 : 0.5 }}>
                            <span style={{ fontSize: '1.5rem' }}>{block.icon || '📌'}</span>
                            <div style={{ flex: 1 }}>
                                <strong>{block.title}</strong>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{block.content.substring(0, 100)}</p>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => toggleVisibility(block)}>{block.visible ? '👁' : '👁‍🗨'}</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(block.id); setForm(block); }}>Edit</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(block.id)}>✕</button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card"><div className="empty-state"><div className="empty-icon">◈</div><div className="empty-title">No blocks</div><div className="empty-text">Add blocks to describe what you're doing now.</div></div></div>
            )}
        </div>
    );
}
