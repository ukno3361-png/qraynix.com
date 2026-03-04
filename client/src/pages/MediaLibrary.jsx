/**
 * client/src/pages/MediaLibrary.jsx
 * Upload, browse, and manage media files.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { media as mediaApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function MediaLibrary() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selected, setSelected] = useState(null);
    const fileInputRef = useRef(null);
    const toast = useToast();

    const load = useCallback(async () => {
        try {
            const data = await mediaApi.list({ limit: 100 });
            setItems(data.items || []);
        } catch (err) { toast.error(err.message); }
        finally { setLoading(false); }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    const handleUpload = async (e) => {
        const files = e.target.files;
        if (!files?.length) return;
        setUploading(true);
        try {
            await mediaApi.upload(files);
            toast.success(`${files.length} file(s) uploaded`);
            load();
        } catch (err) { toast.error(err.message); }
        finally { setUploading(false); e.target.value = ''; }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this file?')) return;
        try {
            await mediaApi.remove(id);
            toast.success('Deleted');
            setSelected(null);
            load();
        } catch (err) { toast.error(err.message); }
    };

    const copyUrl = (item) => {
        const url = `/uploads${item.filename}`;
        navigator.clipboard.writeText(url);
        toast.info('URL copied to clipboard');
    };

    if (loading) return <div className="page-loader"><div className="spinner spinner-lg"></div></div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Media Library</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="file" ref={fileInputRef} onChange={handleUpload} multiple accept="image/*,audio/*,video/*" style={{ display: 'none' }} />
                    <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? 'Uploading...' : '✚ Upload'}
                    </button>
                </div>
            </div>

            {items.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 300px' : '1fr', gap: '1.5rem' }}>
                    <div className="media-grid">
                        {items.map((item) => (
                            <div key={item.id} className="media-item" onClick={() => setSelected(item)} style={{ borderColor: selected?.id === item.id ? 'var(--accent)' : undefined }}>
                                {item.mime_type.startsWith('image/') ? (
                                    <img src={`/uploads${item.filename}`} alt={item.alt_text || item.original_name} loading="lazy" />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-dark)', fontSize: '2rem' }}>
                                        {item.mime_type.startsWith('audio/') ? '🎵' : '🎬'}
                                    </div>
                                )}
                                <div className="media-overlay">
                                    <span className="media-name">{item.original_name}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Detail Panel */}
                    {selected && (
                        <div className="card" style={{ position: 'sticky', top: '80px', alignSelf: 'start' }}>
                            <h3 className="card-title">Details</h3>
                            {selected.mime_type.startsWith('image/') && (
                                <img src={`/uploads${selected.filename}`} alt="" style={{ width: '100%', borderRadius: '4px', marginBottom: '1rem' }} />
                            )}
                            <div className="form-group">
                                <label className="form-label">Filename</label>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{selected.original_name}</p>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selected.mime_type}</p>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Size</label>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{(selected.size_bytes / 1024).toFixed(1)} KB</p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => copyUrl(selected)}>Copy URL</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">◻</div>
                        <div className="empty-title">No media</div>
                        <div className="empty-text">Upload images, audio, or video files.</div>
                        <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>Upload Files</button>
                    </div>
                </div>
            )}
        </div>
    );
}
