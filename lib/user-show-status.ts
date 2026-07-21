import db from "@/lib/db";

export async function refreshUserShowProgress(userId: string, tmdbShowId: number) {
  const row = await db.one<{
    total_episodes: number;
    total_runtime_minutes: number;
    watched_episodes_count: number;
    watched_runtime_minutes: number;
  }>(
    `
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
          WHERE we.user_id = $1
            AND e.tmdb_show_id = $2
          ORDER BY we.user_id, e.tmdb_show_id, we.episode_id, we.watched_at DESC NULLS LAST, we.created_at DESC, we.id DESC
        ) latest
        GROUP BY latest.user_id, latest.tmdb_show_id
      )
      SELECT
        COALESCE(s.number_of_episodes, 0)::int AS total_episodes,
        COALESCE(s.total_runtime_minutes, 0)::int AS total_runtime_minutes,
        COALESCE(w.watched_episodes_count, 0)::int AS watched_episodes_count,
        COALESCE(w.watched_runtime_minutes, 0)::int AS watched_runtime_minutes
      FROM user_shows us
      JOIN shows s ON s.tmdb_id = us.tmdb_id
      LEFT JOIN watched w ON w.user_id = us.user_id AND w.tmdb_show_id = us.tmdb_id
      WHERE us.user_id = $1
        AND us.tmdb_id = $2
      LIMIT 1
    `,
    [userId, tmdbShowId],
  );

  if (!row) return;

  const remainingEpisodes = Math.max(0, row.total_episodes - row.watched_episodes_count);
  const remainingRuntime = Math.max(0, row.total_runtime_minutes - row.watched_runtime_minutes);

  await db.query(
    `
      UPDATE user_shows
      SET
        watched_episodes_count = $3,
        watched_runtime_minutes = $4,
        remaining_episodes_count = $5,
        remaining_runtime_minutes = $6,
        updated_at = now()
      WHERE user_id = $1
        AND tmdb_id = $2
    `,
    [userId, tmdbShowId, row.watched_episodes_count, row.watched_runtime_minutes, remainingEpisodes, remainingRuntime],
  );

  return {
    totalEpisodes: row.total_episodes,
    watchedEpisodesCount: row.watched_episodes_count,
  };
}

export async function refreshAllUsersShowProgress(tmdbShowId: number) {
  await db.query(
    `
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
          WHERE e.tmdb_show_id = $1
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
        ),
        updated_at = now()
      FROM shows s
      WHERE us.tmdb_id = $1
        AND s.tmdb_id = us.tmdb_id
    `,
    [tmdbShowId],
  );
}

export async function reconcileUserShowStatus(userId: string, tmdbShowId: number) {
  const progress = await refreshUserShowProgress(userId, tmdbShowId);

  const row = await db.one<{
    status: string;
    total_episodes: number;
    watched_unique_count: number;
  }>(
    `
      SELECT
        us.status,
        COALESCE(s.number_of_episodes, 0)::int AS total_episodes,
        COALESCE(us.watched_episodes_count, 0)::int AS watched_unique_count
      FROM user_shows us
      JOIN shows s ON s.tmdb_id = us.tmdb_id
      WHERE us.user_id = $1
        AND us.tmdb_id = $2
      LIMIT 1
    `,
    [userId, tmdbShowId],
  );

  if (!row) return;
  const totalEpisodes = progress?.totalEpisodes ?? row.total_episodes;
  const watchedUniqueCount = progress?.watchedEpisodesCount ?? row.watched_unique_count;
  const isComplete = totalEpisodes > 0 && watchedUniqueCount >= totalEpisodes;
  const markedAsWatched = row.status === "watched";
  if (isComplete && !markedAsWatched) {
    await db.query(
      `
        UPDATE user_shows
        SET status = 'watched', updated_at = now()
        WHERE user_id = $1
          AND tmdb_id = $2
      `,
      [userId, tmdbShowId],
    );
    return;
  }

  if (!isComplete && markedAsWatched) {
    await db.query(
      `
        UPDATE user_shows
        SET status = 'watching', updated_at = now()
        WHERE user_id = $1
          AND tmdb_id = $2
      `,
      [userId, tmdbShowId],
    );
  }
}
