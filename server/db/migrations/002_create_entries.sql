-- 002_create_entries.sql
-- Journal entries table — the core content type.
CREATE TABLE IF NOT EXISTS entries (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  content       TEXT NOT NULL DEFAULT '',
  content_html  TEXT,
  excerpt       TEXT,
  status        TEXT DEFAULT 'draft' CHECK(status IN ('draft','published','private')),
  cover_image   TEXT,
  featured      INTEGER DEFAULT 0,
  mood          TEXT,
  location      TEXT,
  weather       TEXT,
  word_count    INTEGER DEFAULT 0,
  read_time     INTEGER DEFAULT 0,
  published_at  TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

-- Full-text search virtual table
CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
  title, content, excerpt,
  content=entries,
  content_rowid=id
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS entries_ai AFTER INSERT ON entries BEGIN
  INSERT INTO entries_fts(rowid, title, content, excerpt)
  VALUES (new.id, new.title, new.content, new.excerpt);
END;

CREATE TRIGGER IF NOT EXISTS entries_ad AFTER DELETE ON entries BEGIN
  INSERT INTO entries_fts(entries_fts, rowid, title, content, excerpt)
  VALUES ('delete', old.id, old.title, old.content, old.excerpt);
END;

CREATE TRIGGER IF NOT EXISTS entries_au AFTER UPDATE ON entries BEGIN
  INSERT INTO entries_fts(entries_fts, rowid, title, content, excerpt)
  VALUES ('delete', old.id, old.title, old.content, old.excerpt);
  INSERT INTO entries_fts(rowid, title, content, excerpt)
  VALUES (new.id, new.title, new.content, new.excerpt);
END;
