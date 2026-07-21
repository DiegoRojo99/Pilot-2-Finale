CREATE TABLE IF NOT EXISTS shows (
  tmdb_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  poster_path TEXT,
  backdrop_path TEXT,
  overview TEXT,
  first_air_date TEXT,
  vote_average DOUBLE PRECISION DEFAULT 0,
  number_of_seasons INTEGER DEFAULT 0,
  number_of_episodes INTEGER DEFAULT 0,
  total_runtime_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shows ADD COLUMN IF NOT EXISTS poster_path TEXT;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS backdrop_path TEXT;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS overview TEXT;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS first_air_date TEXT;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS vote_average DOUBLE PRECISION DEFAULT 0;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS number_of_seasons INTEGER DEFAULT 0;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS number_of_episodes INTEGER DEFAULT 0;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS total_runtime_minutes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE shows ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
UPDATE shows SET total_runtime_minutes = COALESCE(total_runtime_minutes, 0);
UPDATE shows SET created_at = COALESCE(created_at, now()), updated_at = COALESCE(updated_at, now());

CREATE TABLE IF NOT EXISTS user_shows (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  tmdb_id INTEGER NOT NULL,
  name TEXT,
  poster_path TEXT,
  backdrop_path TEXT,
  overview TEXT,
  first_air_date TEXT,
  status TEXT NOT NULL DEFAULT 'watching',
  vote_average DOUBLE PRECISION DEFAULT 0,
  number_of_seasons INTEGER DEFAULT 0,
  number_of_episodes INTEGER DEFAULT 0,
  watched_episodes_count INTEGER NOT NULL DEFAULT 0,
  remaining_episodes_count INTEGER NOT NULL DEFAULT 0,
  watched_runtime_minutes INTEGER NOT NULL DEFAULT 0,
  remaining_runtime_minutes INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_shows ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE user_shows ADD COLUMN IF NOT EXISTS watched_episodes_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_shows ADD COLUMN IF NOT EXISTS remaining_episodes_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_shows ADD COLUMN IF NOT EXISTS watched_runtime_minutes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_shows ADD COLUMN IF NOT EXISTS remaining_runtime_minutes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_shows ALTER COLUMN name DROP NOT NULL;
UPDATE user_shows SET status = 'watching' WHERE status IS NULL OR status NOT IN ('watching', 'want_to_watch', 'watched', 'dropped', 'on_hold');
DELETE FROM user_shows WHERE user_id IS NULL;
UPDATE user_shows SET watched_episodes_count = COALESCE(watched_episodes_count, 0);
UPDATE user_shows SET remaining_episodes_count = COALESCE(remaining_episodes_count, 0);
UPDATE user_shows SET watched_runtime_minutes = COALESCE(watched_runtime_minutes, 0);
UPDATE user_shows SET remaining_runtime_minutes = COALESCE(remaining_runtime_minutes, 0);

INSERT INTO shows (
  tmdb_id,
  name,
  poster_path,
  backdrop_path,
  overview,
  first_air_date,
  vote_average,
  number_of_seasons,
  number_of_episodes
)
SELECT DISTINCT ON (tmdb_id)
  tmdb_id,
  COALESCE(name, 'TMDB Show ' || tmdb_id::text),
  poster_path,
  backdrop_path,
  overview,
  first_air_date,
  COALESCE(vote_average, 0),
  COALESCE(number_of_seasons, 0),
  COALESCE(number_of_episodes, 0)
FROM user_shows
WHERE tmdb_id IS NOT NULL
ORDER BY tmdb_id, updated_at DESC, added_at DESC
ON CONFLICT (tmdb_id) DO UPDATE SET
  name = shows.name,
  poster_path = COALESCE(EXCLUDED.poster_path, shows.poster_path),
  backdrop_path = COALESCE(EXCLUDED.backdrop_path, shows.backdrop_path),
  overview = COALESCE(EXCLUDED.overview, shows.overview),
  first_air_date = COALESCE(EXCLUDED.first_air_date, shows.first_air_date),
  vote_average = COALESCE(EXCLUDED.vote_average, shows.vote_average),
  number_of_seasons = COALESCE(EXCLUDED.number_of_seasons, shows.number_of_seasons),
  number_of_episodes = COALESCE(EXCLUDED.number_of_episodes, shows.number_of_episodes),
  updated_at = now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_shows_tmdb_id_key'
      AND conrelid = 'user_shows'::regclass
  ) THEN
    ALTER TABLE user_shows DROP CONSTRAINT user_shows_tmdb_id_key CASCADE;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS episodes (
  id SERIAL PRIMARY KEY,
  tmdb_episode_id INTEGER,
  tmdb_show_id INTEGER NOT NULL,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  name TEXT,
  overview TEXT,
  air_date TEXT,
  still_path TEXT,
  vote_average DOUBLE PRECISION DEFAULT 0,
  runtime INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE episodes ADD COLUMN IF NOT EXISTS tmdb_episode_id INTEGER;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS overview TEXT;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS air_date TEXT;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS still_path TEXT;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS vote_average DOUBLE PRECISION DEFAULT 0;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS runtime INTEGER;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS watch_entries (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  episode_id INTEGER,
  watched_at TIMESTAMPTZ,
  rating DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE watch_entries ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE watch_entries ADD COLUMN IF NOT EXISTS episode_id INTEGER;
ALTER TABLE watch_entries ALTER COLUMN rating TYPE DOUBLE PRECISION USING rating::double precision;
ALTER TABLE watch_entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE watch_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE watch_entries DROP COLUMN IF EXISTS legacy_episode_log_id;
ALTER TABLE watch_entries ALTER COLUMN watched_at DROP NOT NULL;

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
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_shows_status' AND conrelid = 'user_shows'::regclass) THEN
    ALTER TABLE user_shows DROP CONSTRAINT chk_user_shows_status;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_shows_tmdb_id' AND conrelid = 'user_shows'::regclass) THEN
    ALTER TABLE user_shows DROP CONSTRAINT fk_user_shows_tmdb_id;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_episodes_tmdb_show_id' AND conrelid = 'episodes'::regclass) THEN
    ALTER TABLE episodes DROP CONSTRAINT fk_episodes_tmdb_show_id;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_episodes_show_season_episode' AND conrelid = 'episodes'::regclass) THEN
    ALTER TABLE episodes DROP CONSTRAINT uq_episodes_show_season_episode;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_watch_entries_episode_id' AND conrelid = 'watch_entries'::regclass) THEN
    ALTER TABLE watch_entries DROP CONSTRAINT fk_watch_entries_episode_id;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'watch_entries_rating_check' AND conrelid = 'watch_entries'::regclass) THEN
    ALTER TABLE watch_entries DROP CONSTRAINT watch_entries_rating_check;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_watch_entries_rating' AND conrelid = 'watch_entries'::regclass) THEN
    ALTER TABLE watch_entries DROP CONSTRAINT chk_watch_entries_rating;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_show_genres_show' AND conrelid = 'show_genres'::regclass) THEN
    ALTER TABLE show_genres DROP CONSTRAINT fk_show_genres_show;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_show_genres_genre' AND conrelid = 'show_genres'::regclass) THEN
    ALTER TABLE show_genres DROP CONSTRAINT fk_show_genres_genre;
  END IF;
END
$$;

ALTER TABLE user_shows ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE episodes ALTER COLUMN tmdb_show_id SET NOT NULL;
ALTER TABLE episodes ALTER COLUMN season_number SET NOT NULL;
ALTER TABLE episodes ALTER COLUMN episode_number SET NOT NULL;
DELETE FROM watch_entries WHERE user_id IS NULL OR episode_id IS NULL;
ALTER TABLE watch_entries ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE watch_entries ALTER COLUMN episode_id SET NOT NULL;

ALTER TABLE user_shows
  ADD CONSTRAINT chk_user_shows_status CHECK (status IN ('watching', 'want_to_watch', 'watched', 'dropped', 'on_hold'));
ALTER TABLE user_shows
  ADD CONSTRAINT fk_user_shows_tmdb_id FOREIGN KEY (tmdb_id) REFERENCES shows(tmdb_id) ON DELETE RESTRICT;
ALTER TABLE episodes
  ADD CONSTRAINT uq_episodes_show_season_episode UNIQUE (tmdb_show_id, season_number, episode_number);
ALTER TABLE episodes
  ADD CONSTRAINT fk_episodes_tmdb_show_id FOREIGN KEY (tmdb_show_id) REFERENCES shows(tmdb_id) ON DELETE CASCADE;
ALTER TABLE watch_entries
  ADD CONSTRAINT fk_watch_entries_episode_id FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE;
ALTER TABLE watch_entries
  ADD CONSTRAINT chk_watch_entries_rating CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10));
ALTER TABLE show_genres
  ADD CONSTRAINT fk_show_genres_show FOREIGN KEY (show_tmdb_id) REFERENCES shows(tmdb_id) ON DELETE CASCADE;
ALTER TABLE show_genres
  ADD CONSTRAINT fk_show_genres_genre FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE;

DROP INDEX IF EXISTS idx_user_shows_user_tmdb_unique;
DROP INDEX IF EXISTS idx_episodes_tmdb_episode_id;
DROP INDEX IF EXISTS idx_episodes_show_season_episode;
DROP INDEX IF EXISTS idx_watch_entries_user_episode;
DROP INDEX IF EXISTS idx_watch_entries_user_watched_at;
DROP INDEX IF EXISTS idx_show_genres_genre;
DROP INDEX IF EXISTS idx_show_genres_show;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_shows_user_tmdb_unique ON user_shows(user_id, tmdb_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_episodes_tmdb_episode_id ON episodes(tmdb_episode_id) WHERE tmdb_episode_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_episodes_show_season_episode ON episodes(tmdb_show_id, season_number, episode_number);
CREATE INDEX IF NOT EXISTS idx_watch_entries_user_episode ON watch_entries(user_id, episode_id);
CREATE INDEX IF NOT EXISTS idx_watch_entries_user_watched_at ON watch_entries(user_id, watched_at DESC);
CREATE INDEX IF NOT EXISTS idx_watch_entries_user_episode_latest ON watch_entries(user_id, episode_id, watched_at DESC, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_watch_entries_episode_user_latest ON watch_entries(episode_id, user_id, watched_at DESC, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_shows_updated_at ON shows(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_shows_user_status ON user_shows(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_shows_status ON user_shows(status);
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