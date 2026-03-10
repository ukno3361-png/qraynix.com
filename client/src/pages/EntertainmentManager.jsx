/**
 * client/src/pages/EntertainmentManager.jsx
 * Admin page for managing entertainment reviews.
 * Features: type selector, star rating, rich text review, cover image,
 * audio preview upload/fetch via iTunes API, external link, genre,
 * creator, year, watch status, spoiler toggle, recommendation level,
 * featured toggle, publish status, media library picker, audio playback preview.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { entertainment as api, media as mediaApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import AutocompleteTextarea from '../components/AutocompleteTextarea.jsx';

const TYPES = ['Movie', 'TV Show', 'Music Album', 'Song', 'Podcast', 'Book', 'Game', 'Anime', 'Documentary', 'YouTube', 'Other'];
const WATCH_STATUSES = ['Watching', 'Completed', 'Dropped', 'Plan to Watch', 'On Hold'];
const RECOMMENDATIONS = ['Must Watch', 'Highly Recommended', 'Recommended', 'Mixed Feelings', 'Not Recommended'];

const EMPTY_FORM = {
    title: '', type: 'Movie', rating: 5, review_html: '', review_text: '',
    cover_image: '', audio_preview_url: '', external_link: '', genre: '',
    creator: '', release_year: '', watch_status: 'Completed', has_spoilers: false,
    recommendation_level: 'Recommended', featured: false, status: 'draft',
};

function getYouTubeId(url) {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
}

export default function EntertainmentManager() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [mediaPickerTarget, setMediaPickerTarget] = useState('cover');
    const [mediaFiles, setMediaFiles] = useState([]);
    const [mediaLoading, setMediaLoading] = useState(false);
    const [itunesQuery, setItunesQuery] = useState('');
    const [itunesResults, setItunesResults] = useState([]);
    const [itunesSearching, setItunesSearching] = useState(false);
    const [showItunesPanel, setShowItunesPanel] = useState(false);
    const audioRef = useRef(null);
    const toast = useToast();

    const load = useCallback(async () => {
        try {
            const data = await api.list({ includeAll: 'true' });
            setReviews(data.reviews || []);
        } catch (err) {
            toast.error(err.message || 'Failed to load reviews');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    const openEditor = (review = null) => {
        if (review) {
            setEditing(review.id);
            setForm({
                title: review.title || '',
                type: review.type || 'Movie',
                rating: review.rating || 5,
                review_html: review.review_html || '',
                review_text: review.review_text || '',
                cover_image: review.cover_image || '',
                audio_preview_url: review.audio_preview_url || '',
                external_link: review.external_link || '',
                genre: review.genre || '',
                creator: review.creator || '',
                release_year: review.release_year || '',
                watch_status: review.watch_status || 'Completed',
                has_spoilers: !!review.has_spoilers,
                recommendation_level: review.recommendation_level || 'Recommended',
                featured: !!review.featured,
                status: review.status || 'draft',
            });
        } else {
            setEditing('new');
            setForm({ ...EMPTY_FORM });
        }
        setShowItunesPanel(false);
        setItunesResults([]);
    };

    const closeEditor = () => { setEditing(null); setForm({ ...EMPTY_FORM }); };

    const handleSave = async (overrideStatus) => {
        if (saving) return;
        setSaving(true);
        try {
            const payload = {
                ...form,
                status: overrideStatus || form.status,
                has_spoilers: form.has_spoilers ? 1 : 0,
                featured: form.featured ? 1 : 0,
            };
            if (editing === 'new') {
                await api.create(payload);
                toast.success('Review created');
            } else {
                await api.update(editing, payload);
                toast.success('Review updated');
            }
            closeEditor();
            await load();
        } catch (err) {
            toast.error(err.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this review?')) return;
        try {
            await api.remove(id);
            toast.success('Review deleted');
            if (editing === id) closeEditor();
            await load();
        } catch (err) {
            toast.error(err.message || 'Delete failed');
        }
    };

    // Media library picker
    const openMediaPicker = async (target) => {
        setMediaPickerTarget(target);
        setShowMediaPicker(true);
        setMediaLoading(true);
        try {
            const data = await mediaApi.list({ limit: 50, type: target === 'audio' ? 'audio' : 'image' });
            setMediaFiles(data.items || data.files || data.media || []);
        } catch {
            setMediaFiles([]);
        } finally {
            setMediaLoading(false);
        }
    };

    const selectMedia = (file) => {
        const url = file.url || `/uploads/${file.filename || file.file_path}`;
        if (mediaPickerTarget === 'cover') {
            setForm(f => ({ ...f, cover_image: url }));
        } else {
            setForm(f => ({ ...f, audio_preview_url: url }));
        }
        setShowMediaPicker(false);
    };

    // File upload directly
    const handleFileUpload = async (e, target) => {
        const files = e.target.files;
        if (!files?.length) return;
        try {
            const data = await mediaApi.upload(files);
            const uploaded = Array.isArray(data) ? data[0] : (data.files?.[0] || data.media?.[0]);
            if (uploaded) {
                const url = uploaded.url || `/uploads/${uploaded.filename || uploaded.file_path}`;
                if (target === 'cover') {
                    setForm(f => ({ ...f, cover_image: url }));
                } else {
                    setForm(f => ({ ...f, audio_preview_url: url }));
                }
                toast.success('File uploaded');
            }
        } catch (err) {
            toast.error(err.message || 'Upload failed');
        }
    };

    // iTunes search
    const handleItunesSearch = async () => {
        if (!itunesQuery.trim()) return;
        setItunesSearching(true);
        try {
            const data = await api.itunesSearch(itunesQuery.trim());
            setItunesResults(data.results || []);
        } catch (err) {
            toast.error('iTunes search failed');
        } finally {
            setItunesSearching(false);
        }
    };

    const selectItunesTrack = (track) => {
        setForm(f => ({
            ...f,
            audio_preview_url: track.previewUrl || f.audio_preview_url,
            cover_image: f.cover_image || (track.artworkUrl100 || '').replace('100x100', '600x600'),
            title: f.title || track.trackName,
            creator: f.creator || track.artistName,
            genre: f.genre || track.primaryGenreName,
            external_link: f.external_link || track.trackViewUrl,
        }));
        toast.success('Track details applied');
    };

    const set = (key) => (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm(f => ({ ...f, [key]: val }));
    };

    const filtered = filterType === 'all' ? reviews : reviews.filter(r => r.type === filterType);

    if (loading) return <div className="page-loader"><div className="spinner spinner-lg"></div></div>;

    // ─── Editor View ───
    if (editing !== null) {
        return (
            <div className="entertainment-editor">
                <div className="page-header">
                    <h1 className="page-title">{editing === 'new' ? 'New Review' : 'Edit Review'}</h1>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-ghost" onClick={closeEditor}>Cancel</button>
                        <button className="btn btn-secondary" onClick={() => handleSave('draft')} disabled={saving}>Save Draft</button>
                        <button className="btn btn-primary" onClick={() => handleSave('published')} disabled={saving}>Publish</button>
                    </div>
                </div>

                <div className="entertainment-form-grid">
                    {/* Left Column — Main Fields */}
                    <div className="entertainment-form-main">
                        {/* Title */}
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            <input type="text" className="form-input" value={form.title} onChange={set('title')} placeholder="Enter title..." />
                        </div>

                        {/* Type + Rating Row */}
                        <div className="form-row-2">
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select className="form-input" value={form.type} onChange={set('type')}>
                                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Rating</label>
                                <div className="star-rating-input">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                        <button key={n} type="button" className={`star-btn ${n <= form.rating ? 'filled' : ''}`}
                                            onClick={() => setForm(f => ({ ...f, rating: n }))}>★</button>
                                    ))}
                                    <span className="rating-display">{form.rating}/10</span>
                                </div>
                            </div>
                        </div>

                        {/* Creator + Year Row */}
                        <div className="form-row-2">
                            <div className="form-group">
                                <label className="form-label">Creator / Artist</label>
                                <input type="text" className="form-input" value={form.creator} onChange={set('creator')} placeholder="Director, artist, author..." />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Release Year</label>
                                <input type="number" className="form-input" value={form.release_year} onChange={set('release_year')} placeholder="2024" min="1900" max="2100" />
                            </div>
                        </div>

                        {/* Genre */}
                        <div className="form-group">
                            <label className="form-label">Genre</label>
                            <input type="text" className="form-input" value={form.genre} onChange={set('genre')} placeholder="Action, Drama, Indie Rock..." />
                        </div>

                        {/* Review Text */}
                        <div className="form-group">
                            <label className="form-label">Review / Thoughts</label>
                            <AutocompleteTextarea className="form-textarea" rows={8} value={form.review_html} onChange={set('review_html')} placeholder="Write your review..." />
                        </div>

                        {/* External Link */}
                        <div className="form-group">
                            <label className="form-label">External Link</label>
                            <input type="url" className="form-input" value={form.external_link} onChange={set('external_link')} placeholder="https://..." />
                        </div>

                        {/* Audio Preview Section */}
                        <div className="form-group">
                            <label className="form-label">Audio Preview</label>
                            <div className="audio-preview-controls">
                                <input type="text" className="form-input" value={form.audio_preview_url} onChange={set('audio_preview_url')} placeholder="Audio URL or use buttons below..." />
                                <div className="audio-btn-row">
                                    <label className="btn btn-ghost btn-sm">
                                        Upload Audio
                                        <input type="file" accept="audio/*" hidden onChange={(e) => handleFileUpload(e, 'audio')} />
                                    </label>
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openMediaPicker('audio')}>From Media Library</button>
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowItunesPanel(p => !p); setItunesResults([]); }}>
                                        {showItunesPanel ? 'Close iTunes Search' : '🎵 Search iTunes'}
                                    </button>
                                </div>
                            </div>

                            {form.audio_preview_url && (
                                <div className="audio-inline-preview">
                                    <audio ref={audioRef} controls preload="none" src={form.audio_preview_url} />
                                </div>
                            )}
                        </div>

                        {/* iTunes Search Panel */}
                        {showItunesPanel && (
                            <div className="itunes-search-panel">
                                <div className="itunes-search-bar">
                                    <input type="text" className="form-input" value={itunesQuery} onChange={(e) => setItunesQuery(e.target.value)}
                                        placeholder="Search for a song or artist..."
                                        onKeyDown={(e) => e.key === 'Enter' && handleItunesSearch()} />
                                    <button className="btn btn-primary btn-sm" onClick={handleItunesSearch} disabled={itunesSearching}>
                                        {itunesSearching ? 'Searching...' : 'Search'}
                                    </button>
                                </div>
                                {itunesResults.length > 0 && (
                                    <div className="itunes-results">
                                        {itunesResults.map((track, i) => (
                                            <div key={i} className="itunes-result-item" onClick={() => selectItunesTrack(track)}>
                                                {track.artworkUrl100 && <img src={track.artworkUrl100} alt="" className="itunes-art" />}
                                                <div className="itunes-result-info">
                                                    <div className="itunes-track-name">{track.trackName}</div>
                                                    <div className="itunes-artist">{track.artistName} · {track.collectionName}</div>
                                                </div>
                                                {track.previewUrl && (
                                                    <button className="btn btn-ghost btn-sm" onClick={(e) => {
                                                        e.stopPropagation();
                                                        const audio = new Audio(track.previewUrl);
                                                        audio.play().catch(() => { });
                                                        setTimeout(() => audio.pause(), 30000);
                                                    }}>▶</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column — Sidebar */}
                    <div className="entertainment-form-sidebar">
                        {/* Cover Image */}
                        <div className="form-group">
                            <label className="form-label">Cover Image</label>
                            {form.cover_image && (
                                <div className="ent-cover-preview">
                                    <img src={form.cover_image} alt="Cover" />
                                    <button type="button" className="remove-cover-btn" onClick={() => setForm(f => ({ ...f, cover_image: '' }))}>✕ Remove</button>
                                </div>
                            )}
                            <input type="text" className="form-input" value={form.cover_image} onChange={set('cover_image')} placeholder="Image URL..." style={{ marginTop: '0.5rem', fontSize: '0.78rem' }} />
                            <div className="audio-btn-row" style={{ marginTop: '0.5rem' }}>
                                <label className="btn btn-ghost btn-sm">
                                    Upload
                                    <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e, 'cover')} />
                                </label>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => openMediaPicker('cover')}>Library</button>
                            </div>
                        </div>

                        {/* YouTube URL (when type is YouTube) */}
                        {form.type === 'YouTube' && (
                            <div className="form-group">
                                <label className="form-label">YouTube URL</label>
                                <input type="url" className="form-input" value={form.external_link} onChange={(e) => {
                                    const url = e.target.value;
                                    setForm(f => ({ ...f, external_link: url }));
                                    const vid = getYouTubeId(url);
                                    if (vid && !form.cover_image) {
                                        setForm(f => ({ ...f, cover_image: `https://img.youtube.com/vi/${vid}/hqdefault.jpg` }));
                                    }
                                }} placeholder="https://youtube.com/watch?v=..." />
                                {getYouTubeId(form.external_link) && (
                                    <div className="yt-embed-preview" style={{ marginTop: '0.5rem' }}>
                                        <iframe
                                            width="100%" height="160" style={{ borderRadius: '6px', border: '1px solid var(--border)' }}
                                            src={`https://www.youtube.com/embed/${getYouTubeId(form.external_link)}`}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" allowFullScreen title="Preview"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Watch Status */}
                        <div className="form-group">
                            <label className="form-label">Watch Status</label>
                            <select className="form-input" value={form.watch_status} onChange={set('watch_status')}>
                                {WATCH_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        {/* Recommendation */}
                        <div className="form-group">
                            <label className="form-label">Recommendation</label>
                            <select className="form-input" value={form.recommendation_level} onChange={set('recommendation_level')}>
                                {RECOMMENDATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        {/* Toggles */}
                        <div className="form-group">
                            <label className="toggle-row">
                                <input type="checkbox" checked={form.has_spoilers} onChange={set('has_spoilers')} />
                                <span>Contains Spoilers</span>
                            </label>
                        </div>
                        <div className="form-group">
                            <label className="toggle-row">
                                <input type="checkbox" checked={form.featured} onChange={set('featured')} />
                                <span>Featured Review</span>
                            </label>
                        </div>

                        {/* Status Badge Preview */}
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <span className={`status-badge status-${form.status}`}><span className="status-dot" />{form.status}</span>
                        </div>
                    </div>
                </div>

                {/* Media Library Picker Modal */}
                {showMediaPicker && (
                    <div className="modal-overlay" onClick={() => setShowMediaPicker(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Select from Media Library</h3>
                                <button className="btn btn-ghost btn-sm" onClick={() => setShowMediaPicker(false)}>✕</button>
                            </div>
                            <div className="modal-body">
                                {mediaLoading ? (
                                    <div className="page-loader"><div className="spinner"></div></div>
                                ) : mediaFiles.length > 0 ? (
                                    <div className="media-picker-grid">
                                        {mediaFiles.map((file) => (
                                            <div key={file.id} className="media-picker-item" onClick={() => selectMedia(file)}>
                                                {mediaPickerTarget === 'cover' ? (
                                                    <img src={file.url || `/uploads/${file.filename || file.file_path}`} alt={file.original_name || ''} />
                                                ) : (
                                                    <div className="media-audio-item">🎵 {file.original_name || file.filename}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state"><div className="empty-title">No media found</div></div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ─── List View ───
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Entertainment</h1>
                <button className="btn btn-primary" onClick={() => openEditor()}>✚ New Review</button>
            </div>

            {/* Filter Chips */}
            <div className="entertainment-filter-bar">
                <button className={`filter-chip ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>All ({reviews.length})</button>
                {TYPES.map(t => {
                    const count = reviews.filter(r => r.type === t).length;
                    if (count === 0) return null;
                    return <button key={t} className={`filter-chip ${filterType === t ? 'active' : ''}`} onClick={() => setFilterType(t)}>{t} ({count})</button>;
                })}
            </div>

            {/* Reviews Table */}
            {filtered.length > 0 ? (
                <div className="table-scroll">
                    <table className="data-table entries-table">
                        <thead>
                            <tr>
                                <th>Cover</th>
                                <th>Title</th>
                                <th>Type</th>
                                <th>Rating</th>
                                <th>Status</th>
                                <th>Watch</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((review) => (
                                <tr key={review.id}>
                                    <td>
                                        {review.cover_image ? (
                                            <img src={review.cover_image} alt="" className="entertainment-thumb" />
                                        ) : (
                                            <div className="entertainment-thumb-empty">◻</div>
                                        )}
                                    </td>
                                    <td>
                                        <span className="entry-title-cell">{review.title}</span>
                                        {review.featured ? <span className="featured-badge">★</span> : null}
                                    </td>
                                    <td><span className="entertainment-type-chip">{review.type}</span></td>
                                    <td><span className="rating-stars-sm">{'★'.repeat(Math.round(review.rating / 2))}{'☆'.repeat(5 - Math.round(review.rating / 2))}</span> <span className="rating-num-sm">{review.rating}</span></td>
                                    <td><span className={`status-badge status-${review.status}`}><span className="status-dot" />{review.status}</span></td>
                                    <td><span className="watch-chip">{review.watch_status}</span></td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="edit-link" onClick={() => openEditor(review)}>Edit</button>
                                            <button className="delete-link" onClick={() => handleDelete(review.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">🎬</div>
                        <div className="empty-title">No reviews yet</div>
                        <div className="empty-text">Start reviewing the entertainment you love.</div>
                        <button className="btn btn-primary" onClick={() => openEditor()}>Create Review</button>
                    </div>
                </div>
            )}
        </div>
    );
}
