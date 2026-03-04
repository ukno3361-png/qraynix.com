/**
 * client/src/pages/LiveCamSettings.jsx
 * Configure live camera page and stream embedding.
 */
import React, { useEffect, useState } from 'react';
import { settings as settingsApi, media as mediaApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function LiveCamSettings() {
    const [form, setForm] = useState({});
    const [imageMedia, setImageMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [verifyState, setVerifyState] = useState('idle');
    const [verifyMessage, setVerifyMessage] = useState('');
    const [verifiedUrl, setVerifiedUrl] = useState('');
    const toast = useToast();

    useEffect(() => {
        const load = async () => {
            try {
                const [settingsData, mediaData] = await Promise.all([
                    settingsApi.get(),
                    mediaApi.list({ limit: 500 }),
                ]);
                setForm(settingsData);
                const items = mediaData.items || [];
                setImageMedia(items.filter((item) => String(item.mime_type || '').startsWith('image/')));
            } catch (err) {
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [toast]);

    const set = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (key === 'livecam_placeholder_url') {
            setVerifyState('idle');
            setVerifyMessage('');
            setVerifiedUrl('');
        }
    };

    const verifyPlaceholder = async (rawUrl) => {
        const url = String(rawUrl || '').trim();
        if (!url) {
            setVerifyState('idle');
            setVerifyMessage('');
            setVerifiedUrl('');
            return true;
        }

        setVerifyState('checking');
        setVerifyMessage('Checking image URL...');

        try {
            await new Promise((resolve, reject) => {
                const img = new Image();
                const timeout = window.setTimeout(() => reject(new Error('Image load timed out')), 7000);

                img.onload = () => {
                    window.clearTimeout(timeout);
                    resolve();
                };
                img.onerror = () => {
                    window.clearTimeout(timeout);
                    reject(new Error('Image failed to load'));
                };

                img.src = url;
            });

            setVerifyState('valid');
            setVerifyMessage('Valid image URL');
            setVerifiedUrl(url);
            return true;
        } catch (_err) {
            setVerifyState('invalid');
            setVerifyMessage('Image URL is not usable. Check the link or choose another file.');
            setVerifiedUrl('');
            return false;
        }
    };

    const save = async () => {
        const placeholderUrl = String(form.livecam_placeholder_url || '').trim();
        if (placeholderUrl && (verifiedUrl !== placeholderUrl || verifyState !== 'valid')) {
            const ok = await verifyPlaceholder(placeholderUrl);
            if (!ok) {
                toast.error('Please use a valid placeholder image before saving');
                return;
            }
        }

        setSaving(true);
        try {
            await settingsApi.update(form);
            toast.success('Live Cam settings saved');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="page-loader"><div className="spinner spinner-lg"></div></div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Live Cam</h1>
                <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>

            <div className="settings-grid">
                <div className="card">
                    <h3 className="card-title">Public Page & Stream</h3>

                    <div className="form-group">
                        <label className="form-label">Page Title</label>
                        <input className="form-input" value={form.livecam_title || ''} onChange={(e) => set('livecam_title', e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" rows={3} value={form.livecam_description || ''} onChange={(e) => set('livecam_description', e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Stream URL</label>
                        <input className="form-input" placeholder="http://camera.local/mjpeg or embed URL" value={form.livecam_stream_url || ''} onChange={(e) => set('livecam_stream_url', e.target.value)} />
                        <div className="form-hint">Use a URL accessible by your server visitors.</div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Offline Placeholder Image URL</label>
                        <input
                            className="form-input"
                            placeholder="/uploads/image/... or https://..."
                            value={form.livecam_placeholder_url || ''}
                            onChange={(e) => set('livecam_placeholder_url', e.target.value)}
                            onBlur={(e) => verifyPlaceholder(e.target.value)}
                        />
                        <div className="form-hint">Shown on public page when stream is disabled or missing.</div>
                        <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => verifyPlaceholder(form.livecam_placeholder_url || '')}
                                disabled={verifyState === 'checking' || !String(form.livecam_placeholder_url || '').trim()}>
                                {verifyState === 'checking' ? 'Verifying...' : 'Verify Placeholder'}
                            </button>
                            {verifyState !== 'idle' && (
                                <span
                                    style={{
                                        fontSize: '0.82rem',
                                        color: verifyState === 'valid' ? 'var(--success)' : (verifyState === 'invalid' ? 'var(--danger)' : 'var(--text-faint)'),
                                    }}>
                                    {verifyMessage}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Or Choose from Media Library</label>
                        <select
                            className="form-select"
                            value={(form.livecam_placeholder_url || '').startsWith('/uploads') ? (form.livecam_placeholder_url || '') : ''}
                            onChange={(e) => {
                                if (!e.target.value) return;
                                set('livecam_placeholder_url', e.target.value);
                                verifyPlaceholder(e.target.value);
                            }}>
                            <option value="">Select an uploaded image...</option>
                            {imageMedia.map((item) => (
                                <option key={item.id} value={`/uploads${item.filename}`}>
                                    {item.original_name}
                                </option>
                            ))}
                        </select>
                        <div className="form-hint">Selecting an image fills the same placeholder URL field above.</div>
                    </div>

                    {!!form.livecam_placeholder_url && (
                        <div className="form-group">
                            <label className="form-label">Placeholder Preview</label>
                            <img
                                src={form.livecam_placeholder_url}
                                alt="Live cam placeholder preview"
                                style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-dark)' }}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Embed Mode</label>
                        <select className="form-select" value={form.livecam_embed_mode || 'image'} onChange={(e) => set('livecam_embed_mode', e.target.value)}>
                            <option value="image">Image (MJPEG/Snapshot URL)</option>
                            <option value="video">Video (MP4/WebM stream)</option>
                            <option value="iframe">Iframe (camera vendor web UI)</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <input type="checkbox" checked={form.show_livecam !== 'false'} onChange={(e) => set('show_livecam', e.target.checked ? 'true' : 'false')} />
                            <span className="form-label" style={{ margin: 0 }}>Show Live Cam page publicly</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <input type="checkbox" checked={form.livecam_enabled === 'true'} onChange={(e) => set('livecam_enabled', e.target.checked ? 'true' : 'false')} />
                            <span className="form-label" style={{ margin: 0 }}>Stream enabled</span>
                        </label>
                    </div>
                </div>

                <div className="card">
                    <h3 className="card-title">Setup Guide</h3>
                    <ol style={{ paddingLeft: '1rem', color: 'var(--text-secondary)', display: 'grid', gap: '0.55rem' }}>
                        <li>Buy an IP camera with RTSP/MJPEG support.</li>
                        <li>Connect it to your router and assign a fixed local IP.</li>
                        <li>Enable stream output in camera admin settings.</li>
                        <li>Expose or proxy the stream securely (reverse proxy/VPN).</li>
                        <li>Paste the final public-safe URL in Stream URL.</li>
                    </ol>
                    <p style={{ marginTop: '1rem', color: 'var(--text-faint)', fontSize: '0.85rem' }}>
                        Tip: avoid exposing raw camera admin panels directly to the internet.
                    </p>
                    <a href="/live-cam" className="btn btn-secondary" target="_blank" rel="noreferrer" style={{ marginTop: '0.75rem' }}>Open Public Live Cam ↗</a>
                </div>
            </div>
        </div>
    );
}
