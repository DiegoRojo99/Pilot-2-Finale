import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { readJson } from "@/lib/http";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import type { EpisodeBatchResponse, EpisodeLog, ShowProgress } from "@/types";

export const runtime = "nodejs";

type BatchEpisodeLogsPayload = {
  tmdb_show_ids?: number[];
};

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit({
    key: `api:${getClientAddress(request)}`,
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many requests, please try again later.",
  });

  if (rateLimited) return rateLimited;

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;
  const { userId } = authResult.context;

  const body = await readJson<BatchEpisodeLogsPayload>(request);
  const tmdbShowIds = (body?.tmdb_show_ids ?? [])
    .filter((value): value is number => Number.isFinite(value))
    .map((value) => Number(value));

  if (tmdbShowIds.length === 0) {
    return NextResponse.json({
      logsByShowId: {},
      progressByShowId: {},
    } satisfies EpisodeBatchResponse);
  }

  const { rows } = await db.query<EpisodeLog>(
    `
      SELECT *
      FROM (
        SELECT DISTINCT ON (e.tmdb_show_id, we.episode_id)
          we.id,
          e.id AS episode_id,
          e.tmdb_episode_id,
          e.tmdb_show_id,
          e.season_number,
          e.episode_number,
          e.name AS episode_name,
          we.watched_at,
          we.created_at,
          we.updated_at,
          we.rating,
          we.notes
        FROM watch_entries we
        JOIN episodes e ON e.id = we.episode_id
        WHERE we.user_id = $1
          AND e.tmdb_show_id = ANY($2::int[])
        ORDER BY e.tmdb_show_id, we.episode_id, we.watched_at DESC NULLS LAST, we.created_at DESC, we.id DESC
      ) latest
      ORDER BY latest.tmdb_show_id, latest.season_number ASC, latest.episode_number ASC
    `,
    [userId, tmdbShowIds],
  );

  const logsByShowId: Record<number, EpisodeLog[]> = {};
  for (const log of rows) {
    const bucket = logsByShowId[log.tmdb_show_id] ?? [];
    bucket.push(log);
    logsByShowId[log.tmdb_show_id] = bucket;
  }

  const { rows: progressRows } = await db.query<{
    tmdb_show_id: number;
    watched_unique_count: number;
    number_of_episodes: number;
    next_tmdb_episode_id: number | null;
    next_season_number: number | null;
    next_episode_number: number | null;
    next_episode_name: string | null;
    has_reliable_next: boolean;
  }>(
    `
      WITH requested_show_ids AS (
        SELECT UNNEST($2::int[]) AS tmdb_show_id
      ), user_show_scope AS (
        SELECT
          us.tmdb_id AS tmdb_show_id,
          s.number_of_episodes
        FROM user_shows us
        JOIN shows s ON s.tmdb_id = us.tmdb_id
        JOIN requested_show_ids req ON req.tmdb_show_id = us.tmdb_id
        WHERE us.user_id = $1
      ), latest_logs AS (
        SELECT DISTINCT ON (e.tmdb_show_id, we.episode_id)
          e.tmdb_show_id,
          we.episode_id,
          we.watched_at,
          we.created_at,
          we.id,
          e.season_number,
          e.episode_number
        FROM watch_entries we
        JOIN episodes e ON e.id = we.episode_id
        JOIN requested_show_ids req ON req.tmdb_show_id = e.tmdb_show_id
        WHERE we.user_id = $1
        ORDER BY e.tmdb_show_id, we.episode_id, we.watched_at DESC NULLS LAST, we.created_at DESC, we.id DESC
      ), watched_counts AS (
        SELECT
          tmdb_show_id,
          COUNT(*)::int AS watched_unique_count
        FROM latest_logs
        GROUP BY tmdb_show_id
      ), next_unwatched AS (
        SELECT
          scope.tmdb_show_id,
          candidate.tmdb_episode_id AS next_tmdb_episode_id,
          candidate.season_number AS next_season_number,
          candidate.episode_number AS next_episode_number,
          candidate.name AS next_episode_name
        FROM user_show_scope scope
        LEFT JOIN LATERAL (
          SELECT
            e.tmdb_episode_id,
            e.season_number,
            e.episode_number,
            e.name
          FROM episodes e
          WHERE e.tmdb_show_id = scope.tmdb_show_id
            AND NOT EXISTS (
              SELECT 1
              FROM watch_entries we
              WHERE we.user_id = $1
                AND we.episode_id = e.id
            )
          ORDER BY e.season_number ASC, e.episode_number ASC
          LIMIT 1
        ) candidate ON TRUE
      )
      SELECT
        scope.tmdb_show_id,
        COALESCE(wc.watched_unique_count, 0) AS watched_unique_count,
        COALESCE(scope.number_of_episodes, 0) AS number_of_episodes,
        nu.next_tmdb_episode_id,
        nu.next_season_number,
        nu.next_episode_number,
        nu.next_episode_name,
        (nu.next_season_number IS NOT NULL AND nu.next_episode_number IS NOT NULL) AS has_reliable_next
      FROM user_show_scope scope
      LEFT JOIN watched_counts wc ON wc.tmdb_show_id = scope.tmdb_show_id
      LEFT JOIN next_unwatched nu ON nu.tmdb_show_id = scope.tmdb_show_id
    `,
    [userId, tmdbShowIds],
  );

  const progressByShowId: Record<number, ShowProgress> = {};
  for (const row of progressRows) {
    progressByShowId[row.tmdb_show_id] = {
      tmdb_show_id: row.tmdb_show_id,
      watched_unique_count: row.watched_unique_count,
      number_of_episodes: row.number_of_episodes,
      next_episode:
        row.next_season_number !== null && row.next_episode_number !== null
          ? {
              tmdb_episode_id: row.next_tmdb_episode_id,
              season_number: row.next_season_number,
              episode_number: row.next_episode_number,
              episode_name: row.next_episode_name,
              has_reliable_next: row.has_reliable_next,
            }
          : null,
    };
  }

  return NextResponse.json({
    logsByShowId,
    progressByShowId,
  } satisfies EpisodeBatchResponse);
}
