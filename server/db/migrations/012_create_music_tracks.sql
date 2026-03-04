-- 012_create_music_tracks.sql
-- Music tracks for public music player page.
CREATE TABLE IF NOT EXISTS music_tracks (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  media_id      INTEGER REFERENCES media(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  artist        TEXT,
  album         TEXT,
  album_cover   TEXT,
  notes         TEXT,
  sort_order    INTEGER DEFAULT 0,
  visible       INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_music_tracks_sort_visible
  ON music_tracks (visible, sort_order, updated_at);
