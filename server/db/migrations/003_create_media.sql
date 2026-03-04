-- 003_create_media.sql
-- Uploaded media files (images, audio, video).
CREATE TABLE IF NOT EXISTS media (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id      INTEGER REFERENCES entries(id) ON DELETE SET NULL,
  filename      TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type     TEXT NOT NULL,
  size_bytes    INTEGER,
  width         INTEGER,
  height        INTEGER,
  duration_sec  REAL,
  thumb_path    TEXT,
  alt_text      TEXT,
  caption       TEXT,
  uploaded_at   TEXT DEFAULT (datetime('now'))
);
