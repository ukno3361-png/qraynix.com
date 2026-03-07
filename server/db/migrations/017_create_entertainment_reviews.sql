-- 017_create_entertainment_reviews.sql
-- Entertainment reviews and ratings
CREATE TABLE IF NOT EXISTS entertainment_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Movie',
  rating INTEGER NOT NULL DEFAULT 5,
  review_html TEXT NOT NULL DEFAULT '',
  review_text TEXT NOT NULL DEFAULT '',
  cover_image TEXT NOT NULL DEFAULT '',
  audio_preview_url TEXT NOT NULL DEFAULT '',
  external_link TEXT NOT NULL DEFAULT '',
  genre TEXT NOT NULL DEFAULT '',
  creator TEXT NOT NULL DEFAULT '',
  release_year INTEGER,
  watch_status TEXT NOT NULL DEFAULT 'Completed',
  has_spoilers INTEGER NOT NULL DEFAULT 0,
  recommendation_level TEXT NOT NULL DEFAULT 'Recommended',
  featured INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (type IN ('Movie', 'TV Show', 'Music Album', 'Song', 'Podcast', 'Book', 'Game', 'Anime', 'Documentary', 'Other')),
  CHECK (rating >= 1 AND rating <= 10),
  CHECK (watch_status IN ('Watching', 'Completed', 'Dropped', 'Plan to Watch', 'On Hold')),
  CHECK (recommendation_level IN ('Must Watch', 'Highly Recommended', 'Recommended', 'Mixed Feelings', 'Not Recommended')),
  CHECK (status IN ('draft', 'published'))
);

CREATE INDEX IF NOT EXISTS idx_entertainment_reviews_status
ON entertainment_reviews(status, sort_order, updated_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_entertainment_reviews_type
ON entertainment_reviews(type, status);

CREATE INDEX IF NOT EXISTS idx_entertainment_reviews_featured
ON entertainment_reviews(featured, status);
