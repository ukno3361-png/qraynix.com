-- 014_add_page_visibility_settings.sql
-- Visibility toggles for public pages.
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('show_health', 'true'),
  ('show_future', 'true'),
  ('show_music', 'true'),
  ('show_habits', 'true'),
  ('show_livecam', 'true'),
  ('livecam_enabled', 'false'),
  ('livecam_title', 'Live Cam'),
  ('livecam_description', 'Live feed from a wilderness of loneliness.'),
  ('livecam_stream_url', ''),
  ('livecam_embed_mode', 'image'),
  ('livecam_privacy_note', 'Do not share this URL publicly if it is private.');
