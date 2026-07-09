import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tmdbShowId: string }> },
) {
  const rateLimited = enforceRateLimit({
    key: `api:${getClientAddress(request)}`,
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many requests, please try again later.",
  });

  if (rateLimited) {
    return rateLimited;
  }

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) {
    return authResult.response;
  }
  const { userId } = authResult.context;

  const { tmdbShowId } = await params;
  const { rows: logs } = await db.query(
    `
      SELECT *
      FROM (
        SELECT DISTINCT ON (we.episode_id)
          we.id,
          e.id AS episode_id,
          e.tmdb_episode_id,
          e.tmdb_show_id,
          e.season_number,
          e.episode_number,
          e.name AS episode_name,
          we.rating,
          we.notes,
          we.watched_at,
          we.created_at,
          we.updated_at
        FROM watch_entries we
        JOIN episodes e ON e.id = we.episode_id
        WHERE we.user_id = $1 AND e.tmdb_show_id = $2
        ORDER BY we.episode_id, we.watched_at DESC, we.created_at DESC, we.id DESC
      ) latest
      ORDER BY latest.season_number ASC, latest.episode_number ASC
    `,
    [userId, Number(tmdbShowId)],
  );

  return NextResponse.json(logs);
}
