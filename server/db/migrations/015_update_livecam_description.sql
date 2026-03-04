UPDATE settings
SET value = 'Live feed from a wilderness of loneliness.'
WHERE key = 'livecam_description'
  AND (value = 'Live feed from my space.' OR value IS NULL OR TRIM(value) = '');
