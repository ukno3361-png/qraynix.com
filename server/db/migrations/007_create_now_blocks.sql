-- 007_create_now_blocks.sql
-- "Now" page content blocks (inspired by nownownow.com).
CREATE TABLE IF NOT EXISTS now_blocks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  icon       TEXT,
  sort_order INTEGER DEFAULT 0,
  visible    INTEGER DEFAULT 1,
  updated_at TEXT DEFAULT (datetime('now'))
);
