/**
 * client/src/pages/MusicManager.jsx
 * Manage public music tracks and upload audio/cover files.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { music as musicApi, media as mediaApi, settings as settingsApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import AutocompleteTextarea from '../components/AutocompleteTextarea.jsx';

const EMPTY = {
    media_id: '',
    title: '',
    artist: '',
    album: '',
    album_cover: '',
    notes: '',
    sort_order: 0,
    visible: true,
};

export default function MusicManager() {
    const [tracks, setTracks] = useState([]);
    const [sourceMode, setSourceMode] = useState('local');
    const [spotifyPlaylistUrl, setSpotifyPlaylistUrl] = useState('');
    const [spotifyPlaylistNotes, setSpotifyPlaylistNotes] = useState('');
    const [audioMedia, setAudioMedia] = useState([]);
    const [imageMedia, setImageMedia] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingSource, setSavingSource] = useState(false);
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const audioInputRef = useRef(null);
    const coverInputRef = useRef(null);
    const toast = useToast();

    const load = useCallback(async () => {
        try {
            const [trackData, mediaData, settingsData] = await Promise.all([
                musicApi.list(true),
                mediaApi.list({ limit: 500 }),
                settingsApi.get(),
            ]);

            const items = mediaData.items || [];
            setTracks(trackData || []);
            setAudioMedia(items.filter((m) => String(m.mime_type || '').startsWith('audio/')));
            setImageMedia(items.filter((m) => String(m.mime_type || '').startsWith('image/')));
            setSourceMode((settingsData.music_source || 'local').toLowerCase());
            setSpotifyPlaylistUrl(settingsData.spotify_playlist_url || '');
            setSpotifyPlaylistNotes(settingsData.spotify_playlist_notes || '');
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

    const beginEdit = (track) => {
        setEditingId(track.id);
        setForm({
            media_id: track.media_id || '',
            title: track.title || '',
            artist: track.artist || '',
            album: track.album || '',
            album_cover: track.album_cover || '',
            notes: track.notes || '',
            sort_order: track.sort_order ?? 0,
            visible: Boolean(track.visible),
        });
    };

    const uploadAudio = async (ev) => {
        const files = ev.target.files;
        if (!files?.length) return;
        setUploadingAudio(true);
        try {
            const uploaded = await mediaApi.upload(files);
            const firstAudio = (uploaded || []).find((item) => String(item.mime_type || '').startsWith('audio/'));
            if (firstAudio) {
                setForm((prev) => ({
                    ...prev,
                    media_id: firstAudio.id,
                    title: prev.title || firstAudio.original_name.replace(/\.[^/.]+$/, ''),
                }));
                toast.success('Audio uploaded and selected');
            } else {
                toast.error('No valid audio file uploaded');
            }
            await load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setUploadingAudio(false);
            ev.target.value = '';
        }
    };

    const uploadCover = async (ev) => {
        const files = ev.target.files;
        if (!files?.length) return;
        setUploadingCover(true);
        try {
            const uploaded = await mediaApi.upload(files);
            const firstImage = (uploaded || []).find((item) => String(item.mime_type || '').startsWith('image/'));
            if (firstImage) {
                setForm((prev) => ({ ...prev, album_cover: `/uploads${firstImage.filename}` }));
                toast.success('Cover uploaded and selected');
            } else {
                toast.error('No valid image file uploaded');
            }
            await load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setUploadingCover(false);
            ev.target.value = '';
        }
    };

    const save = async () => {
        if (!form.media_id) {
            toast.error('Select or upload an audio file first');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                media_id: parseInt(form.media_id, 10),
                title: (form.title || '').trim() || 'Untitled track',
                artist: form.artist,
                album: form.album,
                album_cover: form.album_cover,
                notes: form.notes,
                sort_order: parseInt(form.sort_order, 10) || 0,
                visible: form.visible,
            };

            if (editingId) {
                await musicApi.update(editingId, payload);
                toast.success('Track updated');
            } else {
                await musicApi.create(payload);
                toast.success('Track created');
            }

            reset();
            await load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const saveSourceSettings = async () => {
        if (sourceMode === 'spotify' && !spotifyPlaylistUrl.trim()) {
            toast.error('Add a Spotify playlist URL before enabling Spotify mode');
            return;
        }

        setSavingSource(true);
        try {
            await settingsApi.update({
                music_source: sourceMode,
                spotify_playlist_url: spotifyPlaylistUrl.trim(),
                spotify_playlist_notes: spotifyPlaylistNotes,
            });
            toast.success('Music source settings saved');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSavingSource(false);
        }
    };

    const remove = async (id) => {
        if (!confirm('Delete this track from Music page?')) return;
        try {
            await musicApi.remove(id);
            toast.success('Track removed');
            if (editingId === id) reset();
            await load();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const toggleVisible = async (track) => {
        await musicApi.update(track.id, { visible: !track.visible });
        await load();
    };

    if (loading) return <div className="page-loader"><div className="spinner spinner-lg"></div></div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Music</h1>
                <a href="/music" className="btn btn-secondary" target="_blank" rel="noreferrer">View Public Music ↗</a>
            </div>

            <div className="card" style={{ marginBottom: '1.2rem' }}>
                <h3 className="card-title">Playback Source</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Source Mode</label>
                        <select className="form-select" value={sourceMode} onChange={(e) => setSourceMode(e.target.value)}>
                            <option value="local">Local Tracks</option>
                            <option value="spotify">Spotify Playlist</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Spotify Playlist URL</label>
                        <input
                            className="form-input"
                            value={spotifyPlaylistUrl}
                            onChange={(e) => setSpotifyPlaylistUrl(e.target.value)}
                            placeholder="https://open.spotify.com/playlist/..."
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Spotify Playlist Notes (public side card)</label>
                    <AutocompleteTextarea
                        className="form-textarea"
                        rows={3}
                        value={spotifyPlaylistNotes}
                        onChange={(e) => setSpotifyPlaylistNotes(e.target.value)}
                        placeholder="Notes shown on public Music page in Spotify mode"
                    />
                </div>

                <button className="btn btn-primary" onClick={saveSourceSettings} disabled={savingSource}>
                    {savingSource ? 'Saving...' : 'Save Source Settings'}
                </button>
            </div>

            <div className="card" style={{ marginBottom: '1.2rem' }}>
                <h3 className="card-title">{editingId ? 'Edit Track' : 'Add Track'}</h3>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <input ref={audioInputRef} type="file" accept="audio/*" onChange={uploadAudio} style={{ display: 'none' }} />
                    <button className="btn btn-secondary" onClick={() => audioInputRef.current?.click()} disabled={uploadingAudio}>
                        {uploadingAudio ? 'Uploading audio...' : 'Upload Audio'}
                    </button>

                    <input ref={coverInputRef} type="file" accept="image/*" onChange={uploadCover} style={{ display: 'none' }} />
                    <button className="btn btn-secondary" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}>
                        {uploadingCover ? 'Uploading cover...' : 'Upload Cover'}
                    </button>
                </div>

                <div className="form-group">
                    <label className="form-label">Audio File</label>
                    <select className="form-select" value={form.media_id} onChange={(e) => setForm({ ...form, media_id: e.target.value })}>
                        <option value="">Select audio file...</option>
                        {audioMedia.map((item) => (
                            <option key={item.id} value={item.id}>{item.original_name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Artist</label>
                        <input className="form-input" value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Album</label>
                        <input className="form-input" value={form.album} onChange={(e) => setForm({ ...form, album: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Sort Order</label>
                        <input className="form-input" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Album Cover URL</label>
                    <input className="form-input" value={form.album_cover} onChange={(e) => setForm({ ...form, album_cover: e.target.value })} placeholder="/uploads/image/... or https://..." />
                </div>

                <div className="form-group">
                    <label className="form-label">Notes / Opinion (shown on public page for this song)</label>
                    <AutocompleteTextarea className="form-textarea" rows={5} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} />
                        <span className="form-label" style={{ margin: 0 }}>Visible on public page</span>
                    </label>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : (editingId ? 'Update Track' : 'Create Track')}</button>
                    {editingId && <button className="btn btn-secondary" onClick={reset}>Cancel</button>}
                </div>
            </div>

            {tracks.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">♫</div>
                        <div className="empty-title">No tracks yet</div>
                        <div className="empty-text">Upload audio and create your first track.</div>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {tracks.map((track) => (
                        <div key={track.id} className="card" style={{ opacity: track.visible ? 1 : 0.6 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '54px minmax(0,1fr) auto', gap: '0.8rem', alignItems: 'center' }}>
                                <img src={track.album_cover || '/uploads/image/placeholder.png'} onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#1a1712"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#c9a84c" font-size="24">♫</text></svg>'); }} alt="cover" style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <strong>{track.title}</strong>
                                        {track.artist ? <span className="tag-chip">{track.artist}</span> : null}
                                        {track.visible ? <span className="tag-chip">Visible</span> : <span className="tag-chip">Hidden</span>}
                                    </div>
                                    <p style={{ margin: '0.35rem 0 0', color: 'var(--text-faint)', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {track.notes || 'No notes'}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => toggleVisible(track)}>{track.visible ? 'Hide' : 'Show'}</button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => beginEdit(track)}>Edit</button>
                                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => remove(track.id)}>Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
