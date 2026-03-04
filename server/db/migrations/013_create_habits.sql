-- 013_create_habits.sql
-- Habit tracker with daily logs.
CREATE TABLE IF NOT EXISTS habits (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  description     TEXT,
  color           TEXT DEFAULT '#c9a84c',
  target_per_week INTEGER DEFAULT 5,
  visible         INTEGER DEFAULT 1,
  sort_order      INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id   INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  log_date   TEXT NOT NULL,
  status     TEXT NOT NULL CHECK(status IN ('complete','skip','miss')),
  note       TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(habit_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_habits_visible_sort ON habits(visible, sort_order, updated_at);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, log_date);
