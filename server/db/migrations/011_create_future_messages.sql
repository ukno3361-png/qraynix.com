-- 011_create_future_messages.sql
-- Letters/messages written to future self.
CREATE TABLE IF NOT EXISTS future_messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  mood        TEXT,
  target_date TEXT,
  is_public   INTEGER DEFAULT 1,
  is_pinned   INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_future_messages_public_target
  ON future_messages (is_public, target_date);

CREATE INDEX IF NOT EXISTS idx_future_messages_pinned
  ON future_messages (is_pinned, updated_at);
