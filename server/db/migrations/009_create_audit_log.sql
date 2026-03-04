-- 009_create_audit_log.sql
-- Audit log for tracking admin actions.
CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  action     TEXT NOT NULL,
  entity     TEXT,
  entity_id  INTEGER,
  meta       TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
