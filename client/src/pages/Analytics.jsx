/**
 * client/src/pages/Analytics.jsx
 * Writing analytics — word count chart, entries over time, heatmap-style stats.
 */
import React, { useState, useEffect } from 'react';
import { entries as entriesApi } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';

/**
 * Simple bar for inline chart rendering (no recharts dependency needed for basic display).
 */
const Bar = ({ value, max, label, color = 'var(--accent)' }) => (
    <div style={{ marginBottom: '0.8rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{value.toLocaleString()}</span>
        </div>
        <div style={{ background: 'var(--bg-dark)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.5s' }} />
        </div>
    </div>
);

/** Months for chart labels */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Analytics() {
    const [allEntries, setAllEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        const load = async () => {
            try {
                const data = await entriesApi.list({ limit: 500 });
                setAllEntries(data.entries || []);
            } catch (err) { toast.error(err.message); }
            finally { setLoading(false); }
        };
        load();
    }, [toast]);

    if (loading) return <div className="page-loader"><div className="spinner spinner-lg"></div></div>;

    // Compute analytics
    const totalWords = allEntries.reduce((s, e) => s + (e.word_count || 0), 0);
    const avgWords = allEntries.length > 0 ? Math.round(totalWords / allEntries.length) : 0;
    const published = allEntries.filter((e) => e.status === 'published').length;
    const drafts = allEntries.filter((e) => e.status === 'draft').length;
    const longestEntry = allEntries.reduce((max, e) => (e.word_count || 0) > (max?.word_count || 0) ? e : max, null);

    // Monthly breakdown
    const monthly = {};
    allEntries.forEach((e) => {
        const d = new Date(e.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!monthly[key]) monthly[key] = { entries: 0, words: 0, month: d.getMonth(), year: d.getFullYear() };
        monthly[key].entries += 1;
        monthly[key].words += e.word_count || 0;
    });
    const monthlyData = Object.values(monthly).sort((a, b) => a.year - b.year || a.month - b.month);
    const maxMonthlyWords = Math.max(...monthlyData.map((m) => m.words), 1);

    // Status breakdown
    const statuses = [
        { label: 'Published', value: published, color: '#6bc489' },
        { label: 'Draft', value: drafts, color: 'var(--text-secondary)' },
        { label: 'Private', value: allEntries.filter(e => e.status === 'private').length, color: '#6ba8c4' },
    ];
    const maxStatus = Math.max(...statuses.map((s) => s.value), 1);

    // Mood breakdown
    const moodMap = {};
    allEntries.forEach((e) => { if (e.mood) moodMap[e.mood] = (moodMap[e.mood] || 0) + 1; });
    const moods = Object.entries(moodMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxMood = Math.max(...moods.map(([, c]) => c), 1);

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Analytics</h1>
            </div>

            {/* Summary Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{allEntries.length}</div>
                    <div className="stat-label">Total Entries</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{totalWords.toLocaleString()}</div>
                    <div className="stat-label">Total Words</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{avgWords.toLocaleString()}</div>
                    <div className="stat-label">Avg Words/Entry</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{longestEntry?.word_count?.toLocaleString() || 0}</div>
                    <div className="stat-label">Longest Entry</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Monthly Words */}
                <div className="card">
                    <h3 className="card-title">Words by Month</h3>
                    {monthlyData.length > 0 ? (
                        monthlyData.map((m, i) => (
                            <Bar key={i} label={`${MONTHS[m.month]} ${m.year}`} value={m.words} max={maxMonthlyWords} />
                        ))
                    ) : (
                        <p style={{ color: 'var(--text-faint)', fontSize: '0.9rem' }}>No data yet</p>
                    )}
                </div>

                {/* Status Breakdown */}
                <div className="card">
                    <h3 className="card-title">Entry Status</h3>
                    {statuses.map((s) => (
                        <Bar key={s.label} label={s.label} value={s.value} max={maxStatus} color={s.color} />
                    ))}

                    {moods.length > 0 && (
                        <>
                            <h3 className="card-title" style={{ marginTop: '2rem' }}>Common Moods</h3>
                            {moods.map(([mood, count]) => (
                                <Bar key={mood} label={mood} value={count} max={maxMood} color="var(--accent-dim)" />
                            ))}
                        </>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <h3 className="card-title">Writing Streak</h3>
                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                        {(() => {
                            // Generate last 90 days heatmap
                            const cells = [];
                            const today = new Date();
                            const entriesByDay = {};
                            allEntries.forEach((e) => {
                                const day = new Date(e.created_at).toISOString().split('T')[0];
                                entriesByDay[day] = (entriesByDay[day] || 0) + 1;
                            });

                            for (let i = 89; i >= 0; i--) {
                                const d = new Date(today);
                                d.setDate(d.getDate() - i);
                                const key = d.toISOString().split('T')[0];
                                const count = entriesByDay[key] || 0;
                                const opacity = count === 0 ? 0.1 : Math.min(1, 0.3 + count * 0.25);
                                cells.push(
                                    <div
                                        key={key}
                                        title={`${key}: ${count} entries`}
                                        style={{
                                            width: '12px', height: '12px', borderRadius: '2px',
                                            background: count > 0 ? `rgba(201, 168, 76, ${opacity})` : 'var(--bg-dark)',
                                            border: '1px solid var(--border)',
                                        }}
                                    />
                                );
                            }
                            return cells;
                        })()}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-faint)', marginTop: '0.5rem' }}>Last 90 days</p>
                </div>
            </div>
        </div>
    );
}
