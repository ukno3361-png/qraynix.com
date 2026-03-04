-- 004_create_timeline.sql
-- Timeline events for the public timeline page.
CREATE TABLE IF NOT EXISTS timeline_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT,
  event_date  TEXT NOT NULL,
  category    TEXT DEFAULT 'life' CHECK(category IN ('life','work','travel','creative','other')),
  icon        TEXT,
  color       TEXT DEFAULT '#c9a84c',
  link_url    TEXT,
  link_label  TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);
