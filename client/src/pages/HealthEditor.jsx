/**
 * client/src/pages/HealthEditor.jsx
 * Manage public Health page content.
 */
import React, { useState, useEffect } from 'react';
import { settings as settingsApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import AutocompleteTextarea from '../components/AutocompleteTextarea.jsx';

const EMPTY = {
    health_intro: '',
    health_current: '',
    health_history: '',
    health_notes: '',
    health_updated_at: '',
};

export default function HealthEditor() {
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    useEffect(() => {
        const load = async () => {
            try {
                const data = await settingsApi.get();
                setForm({
                    health_intro: data.health_intro || '',
                    health_current: data.health_current || '',
                    health_history: data.health_history || '',
                    health_notes: data.health_notes || '',
                    health_updated_at: data.health_updated_at || '',
                });
            } catch (err) {
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [toast]);

    const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedAt = new Date().toISOString();
            const payload = { ...form, health_updated_at: updatedAt };
            const saved = await settingsApi.update(payload);

            setForm({
                health_intro: saved.health_intro || '',
                health_current: saved.health_current || '',
                health_history: saved.health_history || '',
                health_notes: saved.health_notes || '',
                health_updated_at: saved.health_updated_at || updatedAt,
            });

            toast.success('Health page updated');
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
                <h1 className="page-title">Health</h1>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Health Page'}
                </button>
            </div>

            <div className="card" style={{ marginBottom: '1.25rem' }}>
                <h3 className="card-title">Public Health Page Content</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Edit the sections shown at /health.
                </p>

                <div className="form-group">
                    <label className="form-label">Intro</label>
                    <AutocompleteTextarea
                        className="form-textarea"
                        rows={4}
                        value={form.health_intro}
                        onChange={(e) => set('health_intro', e.target.value)}
                        placeholder="Short overview of your health page"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Current Situation</label>
                    <AutocompleteTextarea
                        className="form-textarea"
                        rows={6}
                        value={form.health_current}
                        onChange={(e) => set('health_current', e.target.value)}
                        placeholder="Current conditions, treatment, and day-to-day status"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">History & Changes</label>
                    <AutocompleteTextarea
                        className="form-textarea"
                        rows={6}
                        value={form.health_history}
                        onChange={(e) => set('health_history', e.target.value)}
                        placeholder="Timeline or milestones"
                    />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Notes</label>
                    <AutocompleteTextarea
                        className="form-textarea"
                        rows={5}
                        value={form.health_notes}
                        onChange={(e) => set('health_notes', e.target.value)}
                        placeholder="Additional notes and context"
                    />
                </div>
            </div>

            <div className="card">
                <h3 className="card-title">Status</h3>
                <p style={{ marginBottom: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Last updated: {form.health_updated_at ? new Date(form.health_updated_at).toLocaleString() : 'Not set yet'}
                </p>
            </div>
        </div>
    );
}
