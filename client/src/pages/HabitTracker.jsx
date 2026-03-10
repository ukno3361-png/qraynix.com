/**
 * client/src/pages/HabitTracker.jsx
 * Habit tracker admin manager.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { habits as habitsApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import AutocompleteTextarea from '../components/AutocompleteTextarea.jsx';

const EMPTY = {
    name: '',
    description: '',
    color: '#c9a84c',
    target_per_week: 5,
    sort_order: 0,
    visible: true,
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const last7Dates = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
};

const statusHeight = (status) => {
    if (status === 'complete') return 100;
    if (status === 'skip') return 60;
    if (status === 'miss') return 30;
    return 12;
};

export default function HabitTracker() {
    const [items, setItems] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [draggingId, setDraggingId] = useState(null);
    const toast = useToast();

    const load = useCallback(async () => {
        try {
            const data = await habitsApi.list(true);
            setItems(data || []);
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

    const save = async () => {
        setSaving(true);
        try {
            const payload = {
                ...form,
                target_per_week: parseInt(form.target_per_week, 10) || 5,
                sort_order: parseInt(form.sort_order, 10) || 0,
                name: (form.name || '').trim() || 'Untitled Habit',
            };

            if (editingId) {
                await habitsApi.update(editingId, payload);
                toast.success('Habit updated');
            } else {
                await habitsApi.create(payload);
                toast.success('Habit created');
            }

            reset();
            await load();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const edit = (habit) => {
        setEditingId(habit.id);
        setForm({
            name: habit.name || '',
            description: habit.description || '',
            color: habit.color || '#c9a84c',
            target_per_week: habit.target_per_week || 5,
            sort_order: habit.sort_order || 0,
            visible: Boolean(habit.visible),
        });
    };

    const remove = async (id) => {
        if (!confirm('Delete this habit and all logs?')) return;
        await habitsApi.remove(id);
        toast.success('Habit removed');
        if (editingId === id) reset();
        await load();
    };

    const mark = async (habitId, status) => {
        await habitsApi.upsertLog(habitId, todayISO(), { status });
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
            await habitsApi.reorder(next.map((habit, index) => ({ id: habit.id, sort_order: index })));
            toast.success('Habit order updated');
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
                <h1 className="page-title">Habit Tracker</h1>
                <a href="/habit-tracker" className="btn btn-secondary" target="_blank" rel="noreferrer">View Public Tracker ↗</a>
            </div>

            <div className="card" style={{ marginBottom: '1.2rem' }}>
                <h3 className="card-title">{editingId ? 'Edit Habit' : 'Create Habit'}</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Color</label>
                        <input className="form-input" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Description</label>
                    <AutocompleteTextarea className="form-textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Target per week</label>
                        <input className="form-input" type="number" value={form.target_per_week} onChange={(e) => setForm({ ...form, target_per_week: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Sort order</label>
                        <input className="form-input" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
                    </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} />
                    <span className="form-label" style={{ margin: 0 }}>Visible publicly</span>
                </label>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : (editingId ? 'Update Habit' : 'Create Habit')}</button>
                    {editingId && <button className="btn btn-secondary" onClick={reset}>Cancel</button>}
                </div>
            </div>

            {items.length === 0 ? (
                <div className="card"><div className="empty-state"><div className="empty-icon">▣</div><div className="empty-title">No habits yet</div><div className="empty-text">Create your first habit above.</div></div></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {items.map((habit) => (
                        <div
                            key={habit.id}
                            className="card"
                            draggable
                            onDragStart={() => setDraggingId(habit.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => reorder(habit.id)}
                            onDragEnd={() => setDraggingId(null)}
                            style={{
                                borderLeft: `4px solid ${habit.color || '#c9a84c'}`,
                                opacity: habit.visible ? 1 : 0.6,
                                cursor: 'grab',
                                transform: draggingId === habit.id ? 'scale(0.995)' : undefined,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        <span className="tag-chip" title="Drag to reorder">↕ Drag</span>
                                        <strong>{habit.name}</strong>
                                        <span className="tag-chip">Current {habit.stats?.current_streak || 0}d</span>
                                        <span className="tag-chip">Best {habit.stats?.longest_streak || 0}d</span>
                                        <span className="tag-chip">30d {habit.stats?.completion_last_30 || 0}%</span>
                                    </div>
                                    <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{habit.description || 'No description'}</p>
                                    <div className="habit-mini-chart" style={{ marginTop: '0.55rem' }}>
                                        {last7Dates().map((date) => {
                                            const log = (habit.recent_logs || []).find((x) => x.log_date === date);
                                            const status = log ? log.status : 'none';
                                            return (
                                                <span
                                                    key={`${habit.id}-${date}`}
                                                    className={`habit-mini-bar ${status}`}
                                                    style={{ height: `${statusHeight(status)}%` }}
                                                    title={`${date} — ${status}`}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => mark(habit.id, 'complete')}>✓ Today</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => mark(habit.id, 'skip')}>Skip</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => mark(habit.id, 'miss')}>Miss</button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => edit(habit)}>Edit</button>
                                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => remove(habit.id)}>Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
