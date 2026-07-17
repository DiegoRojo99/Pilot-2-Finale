import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
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

  const stats = await db.one<{
    total_episodes: number;
    total_shows: number;
    watching_shows: number;
    watched_shows: number;
    want_to_watch: number;
  }>(
    `
      SELECT
        (SELECT COUNT(*)::int FROM watch_entries WHERE user_id = $1) AS total_episodes,
        COUNT(*)::int AS total_shows,
        COUNT(*) FILTER (WHERE status = 'watching')::int AS watching_shows,
        COUNT(*) FILTER (WHERE status = 'watched')::int AS watched_shows,
        COUNT(*) FILTER (WHERE status = 'want_to_watch')::int AS want_to_watch
      FROM user_shows
      WHERE user_id = $1
    `,
    [userId],
  );

  return NextResponse.json({
    totalEpisodes: stats?.total_episodes ?? 0,
    totalShows: stats?.total_shows ?? 0,
    watchingShows: stats?.watching_shows ?? 0,
    watchedShows: stats?.watched_shows ?? 0,
    wantToWatch: stats?.want_to_watch ?? 0,
  });
}
