-- 005_create_tags.sql
-- Tags for categorizing journal entries.
CREATE TABLE IF NOT EXISTS tags (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE,
  slug  TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#c9a84c'
);
