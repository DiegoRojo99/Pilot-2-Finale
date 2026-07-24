import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { defaultRateLimit } from "@/lib/rate-limit";
import { reconcileUserShowStatus } from "@/lib/user-show-status";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tmdbShowId: string; season: string; episode: string }> },
) {
  const rateLimited = defaultRateLimit(request);
  if (rateLimited) return rateLimited;

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;
  const { userId } = authResult.context;
  const { tmdbShowId, season, episode } = await params;
  const result = await db.query(
    `
      SELECT
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
        AND e.tmdb_show_id = $2
        AND e.season_number = $3
        AND e.episode_number = $4
      ORDER BY we.watched_at DESC NULLS LAST, we.created_at DESC, we.id DESC
    `,
    [userId, Number(tmdbShowId), Number(season), Number(episode)],
  );

  return NextResponse.json(result.rows);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tmdbShowId: string; season: string; episode: string }> },
) {
  const rateLimited = defaultRateLimit(request);

  if (rateLimited) {
    return rateLimited;
  }

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) {
    return authResult.response;
  }
  const { userId } = authResult.context;

  const { tmdbShowId, season, episode } = await params;
  const result = await db.query(
    `
      DELETE FROM watch_entries we
      USING episodes e
      WHERE we.user_id = $1
        AND we.episode_id = e.id
        AND e.tmdb_show_id = $2
        AND e.season_number = $3
        AND e.episode_number = $4
      RETURNING we.id
    `,
    [userId, Number(tmdbShowId), Number(season), Number(episode)],
  );

  if (result.rows.length === 0) return NextResponse.json({ error: "Episode log not found" }, { status: 404 });
  await reconcileUserShowStatus(userId, Number(tmdbShowId));
  return NextResponse.json({ success: true });
}
