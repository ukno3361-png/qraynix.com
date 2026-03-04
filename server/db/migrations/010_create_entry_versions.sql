-- 010_create_entry_versions.sql
-- Version history snapshots for autosave / restore.
CREATE TABLE IF NOT EXISTS entry_versions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id   INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
