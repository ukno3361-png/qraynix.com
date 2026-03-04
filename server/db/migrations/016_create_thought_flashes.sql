CREATE TABLE IF NOT EXISTS thought_flashes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  preview_text TEXT NOT NULL,
  thought_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (media_type IN ('image', 'gif', 'mp4'))
);

CREATE INDEX IF NOT EXISTS idx_thought_flashes_visible_sort
ON thought_flashes(visible, sort_order, updated_at DESC, id DESC);
