/**
 * client/src/pages/ThoughtFlashManager.jsx
 * Manage random thought flash media cards for the public infinite grid.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { thoughtFlash as thoughtFlashApi, media as mediaApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';

const EMPTY = {
    media_url: '',
    media_type: 'image',
    preview_text: '',
    thought_text: '',
    sort_order: 0,
    visible: true,
};

const detectMediaType = (url, mimeType = '') => {
    const mime = String(mimeType || '').toLowerCase();
    if (mime.includes('video/')) return 'mp4';
    if (mime.includes('gif')) return 'gif';

    const raw = String(url || '').toLowerCase().split('?')[0].split('#')[0];
    if (raw.endsWith('.mp4') || raw.endsWith('.webm') || raw.endsWith('.mov')) return 'mp4';
    if (raw.endsWith('.gif')) return 'gif';
    return 'image';
};

export default function ThoughtFlashManager() {
    const [items, setItems] = useState([]);
    const [mediaItems, setMediaItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [draggingId, setDraggingId] = useState(null);
    const toast = useToast();

    const load = useCallback(async () => {
        try {
            const [data, mediaData] = await Promise.all([
                thoughtFlashApi.list({ includeHidden: true, limit: 200, offset: 0 }),
                mediaApi.list({ limit: 500 }),
            ]);
            setItems(Array.isArray(data) ? data : []);
            const allMedia = mediaData.items || [];
            setMediaItems(allMedia.filter((m) => {
                const mime = String(m.mime_type || '').toLowerCase();
                return mime.startsWith('image/') || mime.startsWith('video/');
            }));
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    const reset = () => {
        setEditingId(null);
        setForm(EMPTY);
    };

    const selectMediaFromLibrary = (value) => {
        if (!value) return;
        const selected = mediaItems.find((m) => String(m.id) === String(value));
        if (!selected) return;

        const mediaUrl = `/uploads${selected.filename}`;
        const mediaType = detectMediaType(mediaUrl, selected.mime_type);
        setForm((prev) => ({
            ...prev,
            media_url: mediaUrl,
            media_type: mediaType,
        }));
    };

    const beginEdit = (item) => {
        setEditingId(item.id);
        setForm({
            media_url: item.media_url || '',
            media_type: item.media_type || 'image',
            preview_text: item.preview_text || '',
            thought_text: item.thought_text || '',
            sort_order: item.sort_order ?? 0,
            visible: Boolean(item.visible),
        });
    };

    const save = async () => {
        if (!String(form.media_url || '').trim()) {
            toast.error('Media URL is required');
            return;
        }
        if (!String(form.preview_text || '').trim()) {
            toast.error('Preview text is required');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                media_url: String(form.media_url || '').trim(),
                media_type: form.media_type,
                preview_text: form.preview_text,
                thought_text: form.thought_text,
                sort_order: parseInt(form.sort_order, 10) || 0,
                visible: form.visible,
            };

            if (editingId) {
                await thoughtFlashApi.update(editingId, payload);
                toast.success('Thought flash updated');
            } else {
                await thoughtFlashApi.create(payload);
                toast.success('Thought flash created');
            }

            reset();
            await load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id) => {
        if (!confirm('Delete this thought flash item?')) return;
        try {
            await thoughtFlashApi.remove(id);
            toast.success('Deleted');
            if (editingId === id) reset();
            await load();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const toggleVisible = async (item) => {
        await thoughtFlashApi.update(item.id, { visible: !item.visible });
        await load();
    };

    const reorder = async (targetId) => {
        if (!draggingId || draggingId === targetId) return;

        const before = [...items];
        const next = [...items];
        const from = next.findIndex((x) => x.id === draggingId);
        const to = next.findIndex((x) => x.id === targetId);
        if (from < 0 || to < 0) return;

        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        setItems(next);

        try {
            await thoughtFlashApi.reorder(next.map((item, index) => ({ id: item.id, sort_order: index })));
            toast.success('Thought flash order updated');
        } catch (err) {
            setItems(before);
            toast.error(err.message);
        } finally {
            setDraggingId(null);
        }
    };

    if (loading) return <div className="page-loader"><div className="spinner spinner-lg"></div></div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Thought Flash</h1>
                <a href="/thought-flash" className="btn btn-secondary" target="_blank" rel="noreferrer">View Public Page ↗</a>
            </div>

            <div className="card" style={{ marginBottom: '1.2rem' }}>
                <h3 className="card-title">{editingId ? 'Edit Item' : 'Create Item'}</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Media URL</label>
                        <input
                            className="form-input"
                            placeholder="/uploads/... or data:image/... or https://..."
                            value={form.media_url}
                            onChange={(e) => {
                                const mediaUrl = e.target.value;
                                setForm({ ...form, media_url: mediaUrl, media_type: detectMediaType(mediaUrl) });
                            }}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Media Type (Auto)</label>
                        <input className="form-input" value={String(form.media_type || 'image').toUpperCase()} readOnly />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Select from Media Library</label>
                    <select className="form-select" defaultValue="" onChange={(e) => selectMediaFromLibrary(e.target.value)}>
                        <option value="">Choose uploaded image/video...</option>
                        {mediaItems.map((media) => (
                            <option key={media.id} value={media.id}>
                                {media.original_name} ({media.mime_type})
                            </option>
                        ))}
                    </select>
                    <div className="form-hint">Auto-detects media type for .gif, .mp4, .jpg, .png, etc.</div>
                </div>

                <div className="form-group">
                    <label className="form-label">Preview Description (card preview)</label>
                    <textarea className="form-textarea" rows={3} value={form.preview_text} onChange={(e) => setForm({ ...form, preview_text: e.target.value })} />
                </div>

                <div className="form-group">
                    <label className="form-label">Thought (shown in modal)</label>
                    <textarea className="form-textarea" rows={5} value={form.thought_text} onChange={(e) => setForm({ ...form, thought_text: e.target.value })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Sort Order</label>
                        <input className="form-input" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} />
                        <span className="form-label" style={{ margin: 0 }}>Visible</span>
                    </label>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : (editingId ? 'Update Item' : 'Create Item')}</button>
                    {editingId && <button className="btn btn-secondary" onClick={reset}>Cancel</button>}
                </div>
            </div>

            {items.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">◇</div>
                        <div className="empty-title">No thought flash items</div>
                        <div className="empty-text">Create items to populate the public infinite grid.</div>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="card"
                            draggable
                            onDragStart={() => setDraggingId(item.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => reorder(item.id)}
                            onDragEnd={() => setDraggingId(null)}
                            style={{
                                opacity: item.visible ? 1 : 0.6,
                                cursor: 'grab',
                                transform: draggingId === item.id ? 'scale(0.995)' : undefined,
                            }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '80px minmax(0,1fr) auto', gap: '0.8rem', alignItems: 'center' }}>
                                <img src={item.media_url} alt="media" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="100%" height="100%" fill="#111215"/><text x="50%" y="55%" fill="#b19bcf" text-anchor="middle" font-size="18">media</text></svg>'); }} />
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span className="tag-chip" title="Drag to reorder">↕ Drag</span>
                                        <strong>{item.preview_text}</strong>
                                        <span className="tag-chip">{item.media_type}</span>
                                        {item.visible ? <span className="tag-chip">Visible</span> : <span className="tag-chip">Hidden</span>}
                                    </div>
                                    <p style={{ margin: '0.35rem 0 0', color: 'var(--text-faint)', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {item.thought_text || 'No thought text'}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => toggleVisible(item)}>{item.visible ? 'Hide' : 'Show'}</button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => beginEdit(item)}>Edit</button>
                                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => remove(item.id)}>Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
