-- The shows table columns were already added in the baseline migration
-- Just ensure the genres and show_genres tables exist

CREATE TABLE IF NOT EXISTS genres (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS show_genres (
  show_tmdb_id INTEGER NOT NULL,
  genre_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (show_tmdb_id, genre_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_show_genres_show'
      AND conrelid = 'show_genres'::regclass
  ) THEN
    ALTER TABLE show_genres
      ADD CONSTRAINT fk_show_genres_show FOREIGN KEY (show_tmdb_id) REFERENCES shows(tmdb_id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_show_genres_genre'
      AND conrelid = 'show_genres'::regclass
  ) THEN
    ALTER TABLE show_genres
      ADD CONSTRAINT fk_show_genres_genre FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_show_genres_genre ON show_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_show_genres_show ON show_genres(show_tmdb_id);

UPDATE shows s
SET total_runtime_minutes = COALESCE(ep.total_runtime_minutes, 0)
FROM (
  SELECT tmdb_show_id, COALESCE(SUM(COALESCE(runtime, 0)), 0)::int AS total_runtime_minutes
  FROM episodes
  GROUP BY tmdb_show_id
) ep
WHERE s.tmdb_id = ep.tmdb_show_id;

UPDATE shows
SET total_runtime_minutes = 0
WHERE total_runtime_minutes IS NULL;

WITH watched AS (
  SELECT
    latest.user_id,
    latest.tmdb_show_id,
    COUNT(*)::int AS watched_episodes_count,
    COALESCE(SUM(latest.runtime), 0)::int AS watched_runtime_minutes
  FROM (
    SELECT DISTINCT ON (we.user_id, e.tmdb_show_id, we.episode_id)
      we.user_id,
      e.tmdb_show_id,
      COALESCE(e.runtime, 0) AS runtime
    FROM watch_entries we
    JOIN episodes e ON e.id = we.episode_id
    ORDER BY we.user_id, e.tmdb_show_id, we.episode_id, we.watched_at DESC NULLS LAST, we.created_at DESC, we.id DESC
  ) latest
  GROUP BY latest.user_id, latest.tmdb_show_id
)
UPDATE user_shows us
SET
  watched_episodes_count = COALESCE((
    SELECT w.watched_episodes_count
    FROM watched w
    WHERE w.user_id = us.user_id
      AND w.tmdb_show_id = us.tmdb_id
  ), 0),
  watched_runtime_minutes = COALESCE((
    SELECT w.watched_runtime_minutes
    FROM watched w
    WHERE w.user_id = us.user_id
      AND w.tmdb_show_id = us.tmdb_id
  ), 0),
  remaining_episodes_count = GREATEST(
    COALESCE(s.number_of_episodes, 0) - COALESCE((
      SELECT w.watched_episodes_count
      FROM watched w
      WHERE w.user_id = us.user_id
        AND w.tmdb_show_id = us.tmdb_id
    ), 0),
    0
  ),
  remaining_runtime_minutes = GREATEST(
    COALESCE(s.total_runtime_minutes, 0) - COALESCE((
      SELECT w.watched_runtime_minutes
      FROM watched w
      WHERE w.user_id = us.user_id
        AND w.tmdb_show_id = us.tmdb_id
    ), 0),
    0
  )
FROM shows s
WHERE us.tmdb_id = s.tmdb_id;