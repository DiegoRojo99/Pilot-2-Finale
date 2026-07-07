import { NextResponse } from "next/server";
import db from "@/lib/db";
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

  const { tmdbShowId } = await params;
  const { rows: logs } = await db.query(
    `
      SELECT season_number, episode_number, rating, notes, watched_at
      FROM episode_logs
      WHERE tmdb_show_id = $1
      ORDER BY season_number ASC, episode_number ASC
    `,
    [Number(tmdbShowId)],
  );

  return NextResponse.json(logs);
}
