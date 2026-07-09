import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tmdbShowId: string; season: string; episode: string }> },
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

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Episode log not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
