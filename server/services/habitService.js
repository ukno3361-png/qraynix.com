/**
 * server/services/habitService.js
 * Habit and daily log management with summary stats.
 */

const { getDb } = require('../db');

const toISODate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
};

const daysBetween = (a, b) => {
    const da = new Date(a);
    const db = new Date(b);
    da.setHours(0, 0, 0, 0);
    db.setHours(0, 0, 0, 0);
    return Math.round((db.getTime() - da.getTime()) / (24 * 60 * 60 * 1000));
};

const createHabitService = () => {
    const list = ({ includeHidden = false } = {}) => {
        const db = getDb();
        const where = includeHidden ? '' : 'WHERE h.visible = 1';

        const habits = db.prepare(`
            SELECT h.*
            FROM habits h
            ${where}
            ORDER BY h.sort_order ASC, h.updated_at DESC, h.id DESC
        `).all();

        const today = toISODate(new Date());
        const thirtyDaysAgo = toISODate(new Date(Date.now() - (29 * 24 * 60 * 60 * 1000)));

        return habits.map((habit) => {
            const logs = db.prepare(`
                SELECT log_date, status, note
                FROM habit_logs
                WHERE habit_id = ?
                ORDER BY log_date DESC
                LIMIT 120
            `).all(habit.id);

            const todayLog = logs.find((l) => l.log_date === today) || null;

            const completes30 = db.prepare(`
                SELECT COUNT(*) as c
                FROM habit_logs
                WHERE habit_id = ? AND status = 'complete' AND log_date >= ?
            `).get(habit.id, thirtyDaysAgo).c;

            const thisWeekStart = (() => {
                const d = new Date();
                const day = d.getDay();
                const diff = day === 0 ? 6 : day - 1;
                d.setDate(d.getDate() - diff);
                return toISODate(d);
            })();

            const completesThisWeek = db.prepare(`
                SELECT COUNT(*) as c
                FROM habit_logs
                WHERE habit_id = ? AND status = 'complete' AND log_date >= ?
            `).get(habit.id, thisWeekStart).c;

            const completeDates = logs
                .filter((l) => l.status === 'complete')
                .map((l) => l.log_date)
                .sort();

            let longestStreak = 0;
            let running = 0;
            let prevDate = null;
            completeDates.forEach((date) => {
                if (!prevDate) {
                    running = 1;
                } else {
                    const diff = daysBetween(prevDate, date);
                    running = diff === 1 ? running + 1 : 1;
                }
                prevDate = date;
                if (running > longestStreak) longestStreak = running;
            });

            let currentStreak = 0;
            let cursor = today;
            for (let i = 0; i < 365; i++) {
                const hit = completeDates.includes(cursor);
                if (!hit) break;
                currentStreak += 1;
                const d = new Date(cursor);
                d.setDate(d.getDate() - 1);
                cursor = toISODate(d);
            }

            const recentLogs = logs.filter((l) => daysBetween(l.log_date, today) >= 0 && daysBetween(l.log_date, today) <= 29);

            return {
                ...habit,
                stats: {
                    current_streak: currentStreak,
                    longest_streak: longestStreak,
                    completion_last_30: Math.round((completes30 / 30) * 100),
                    completes_this_week: completesThisWeek,
                    today_status: todayLog ? todayLog.status : 'none',
                },
                recent_logs: recentLogs,
            };
        });
    };

    const getById = (id) => {
        const db = getDb();
        return db.prepare('SELECT * FROM habits WHERE id = ?').get(id) || null;
    };

    const create = (data) => {
        const db = getDb();
        const result = db.prepare(`
            INSERT INTO habits (name, description, color, target_per_week, visible, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            (data.name || 'Untitled habit').trim(),
            data.description || null,
            data.color || '#c9a84c',
            data.target_per_week ?? 5,
            data.visible === false ? 0 : 1,
            data.sort_order ?? 0
        );
        return getById(result.lastInsertRowid);
    };

    const update = (id, patch) => {
        const db = getDb();
        const allowed = ['name', 'description', 'color', 'target_per_week', 'visible', 'sort_order'];
        const updates = Object.entries(patch).filter(([k]) => allowed.includes(k));
        if (updates.length === 0) return getById(id);

        const normalized = updates.map(([k, v]) => {
            if (k === 'visible') return [k, v ? 1 : 0];
            return [k, v];
        });

        const set = normalized.map(([k]) => `${k} = ?`).join(', ');
        db.prepare(`UPDATE habits SET ${set}, updated_at = datetime('now') WHERE id = ?`)
            .run(...normalized.map(([, v]) => v), id);

        return getById(id);
    };

    const remove = (id) => {
        const db = getDb();
        db.prepare('DELETE FROM habits WHERE id = ?').run(id);
    };

    const reorder = (items) => {
        const db = getDb();
        const tx = db.transaction(() => {
            const stmt = db.prepare('UPDATE habits SET sort_order = ?, updated_at = datetime(\'now\') WHERE id = ?');
            (items || []).forEach(({ id, sort_order }) => {
                stmt.run(sort_order, id);
            });
        });
        tx();
    };

    const upsertLog = ({ habitId, date, status, note }) => {
        const db = getDb();
        const logDate = toISODate(date || new Date());
        db.prepare(`
            INSERT INTO habit_logs (habit_id, log_date, status, note, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'))
            ON CONFLICT(habit_id, log_date)
            DO UPDATE SET status = excluded.status, note = excluded.note, updated_at = datetime('now')
        `).run(habitId, logDate, status, note || null);

        return db.prepare('SELECT * FROM habit_logs WHERE habit_id = ? AND log_date = ?').get(habitId, logDate);
    };

    const listLogs = ({ habitId, startDate, endDate }) => {
        const db = getDb();
        let where = ['habit_id = ?'];
        let params = [habitId];

        if (startDate) {
            where.push('log_date >= ?');
            params.push(toISODate(startDate));
        }

        if (endDate) {
            where.push('log_date <= ?');
            params.push(toISODate(endDate));
        }

        return db.prepare(`
            SELECT * FROM habit_logs
            WHERE ${where.join(' AND ')}
            ORDER BY log_date DESC
        `).all(...params);
    };

    return { list, getById, create, update, remove, reorder, upsertLog, listLogs };
};

module.exports = { createHabitService };
