-- 008_create_settings.sql
-- Key-value site settings.
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Seed default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('site_title', 'Qraynix'),
  ('tagline', 'A Living Grimoire'),
  ('description', 'Personal journal and portfolio'),
  ('footer_text', '© Qraynix. All rights reserved.'),
  ('accent_color', '#c9a84c'),
  ('entries_per_page', '10'),
  ('show_now', 'true'),
  ('show_timeline', 'true'),
  ('social_github', ''),
  ('social_twitter', ''),
  ('social_mastodon', ''),
  ('social_instagram', ''),
  ('social_linkedin', ''),
  ('allow_indexing', 'true'),
  ('rss_enabled', 'true');
