import db from "@/lib/db";

export async function reconcileUserShowStatus(userId: string, tmdbShowId: number) {
  const row = await db.one<{
    status: string;
    total_episodes: number;
    watched_unique_count: number;
  }>(
    `
      WITH watched AS (
        SELECT COUNT(DISTINCT we.episode_id)::int AS watched_unique_count
        FROM watch_entries we
        JOIN episodes e ON e.id = we.episode_id
        WHERE we.user_id = $1
          AND e.tmdb_show_id = $2
      )
      SELECT
        us.status,
        COALESCE(s.number_of_episodes, 0)::int AS total_episodes,
        COALESCE(w.watched_unique_count, 0)::int AS watched_unique_count
      FROM user_shows us
      JOIN shows s ON s.tmdb_id = us.tmdb_id
      LEFT JOIN watched w ON TRUE
      WHERE us.user_id = $1
        AND us.tmdb_id = $2
      LIMIT 1
    `,
    [userId, tmdbShowId],
  );

  if (!row) return;
  const isComplete = row.total_episodes > 0 && row.watched_unique_count >= row.total_episodes;
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
