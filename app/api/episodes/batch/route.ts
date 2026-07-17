import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { readJson } from "@/lib/http";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import type { EpisodeLog } from "@/types";

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

  if (tmdbShowIds.length === 0) return NextResponse.json({ logsByShowId: {} as Record<number, EpisodeLog[]> });
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

  return NextResponse.json({ logsByShowId });
}
