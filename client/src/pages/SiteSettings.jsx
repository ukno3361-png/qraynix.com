/**
 * client/src/pages/SiteSettings.jsx
 * Site-wide settings editor (title, tagline, socials, toggles).
 */
import React, { useState, useEffect } from 'react';
import { settings as settingsApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function SiteSettings() {
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    useEffect(() => {
        const load = async () => {
            try { setForm(await settingsApi.get()); }
            catch (err) { toast.error(err.message); }
            finally { setLoading(false); }
        };
        load();
    }, [toast]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await settingsApi.update(form);
            toast.success('Settings saved');
        } catch (err) { toast.error(err.message); }
        finally { setSaving(false); }
    };

    const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    if (loading) return <div className="page-loader"><div className="spinner spinner-lg"></div></div>;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Site Settings</h1>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>

            <div className="settings-grid">
                {/* General */}
                <div className="card">
                    <h3 className="card-title">General</h3>
                    <div className="form-group">
                        <label className="form-label">Site Title</label>
                        <input className="form-input" value={form.site_title || ''} onChange={(e) => set('site_title', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tagline</label>
                        <input className="form-input" value={form.tagline || ''} onChange={(e) => set('tagline', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" rows={2} value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Footer Text</label>
                        <input className="form-input" value={form.footer_text || ''} onChange={(e) => set('footer_text', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Entries Per Page</label>
                        <input className="form-input" type="number" value={form.entries_per_page || 10} onChange={(e) => set('entries_per_page', e.target.value)} />
                    </div>
                </div>

                {/* Socials */}
                <div className="card">
                    <h3 className="card-title">Social Links</h3>
                    {['github', 'twitter', 'mastodon', 'instagram', 'linkedin'].map((platform) => (
                        <div className="form-group" key={platform}>
                            <label className="form-label" style={{ textTransform: 'capitalize' }}>{platform}</label>
                            <input className="form-input" value={form[`social_${platform}`] || ''} onChange={(e) => set(`social_${platform}`, e.target.value)} placeholder={`https://${platform}.com/...`} />
                        </div>
                    ))}
                </div>

                {/* Toggles */}
                <div className="card">
                    <h3 className="card-title">Features</h3>
                    {[
                        { key: 'show_now', label: 'Show Now Page' },
                        { key: 'show_timeline', label: 'Show Timeline' },
                        { key: 'rss_enabled', label: 'RSS Feed' },
                        { key: 'allow_indexing', label: 'Allow Search Indexing' },
                    ].map(({ key, label }) => (
                        <div className="form-group" key={key}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={form[key] === 'true'} onChange={(e) => set(key, e.target.checked ? 'true' : 'false')} />
                                <span className="form-label" style={{ margin: 0 }}>{label}</span>
                            </label>
                        </div>
                    ))}
                </div>

                {/* Theme */}
                <div className="card">
                    <h3 className="card-title">Theme</h3>
                    <div className="form-group">
                        <label className="form-label">Accent Color</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input type="color" value={form.accent_color || '#c9a84c'} onChange={(e) => set('accent_color', e.target.value)} style={{ width: '40px', height: '40px', border: 'none', background: 'none', cursor: 'pointer' }} />
                            <input className="form-input" value={form.accent_color || '#c9a84c'} onChange={(e) => set('accent_color', e.target.value)} style={{ width: '120px' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
