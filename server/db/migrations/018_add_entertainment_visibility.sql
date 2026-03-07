-- 018_add_entertainment_visibility.sql
-- Add entertainment page visibility toggle
INSERT OR IGNORE INTO settings (key, value) VALUES ('show_entertainment', 'true');
