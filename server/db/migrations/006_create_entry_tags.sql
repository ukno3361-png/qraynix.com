-- 006_create_entry_tags.sql
-- Junction table linking entries to tags (many-to-many).
CREATE TABLE IF NOT EXISTS entry_tags (
  entry_id INTEGER REFERENCES entries(id) ON DELETE CASCADE,
  tag_id   INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);
