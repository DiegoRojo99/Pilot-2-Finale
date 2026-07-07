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

  const totalEpisodesResult = await db.one<{ count: string }>(
    "SELECT COUNT(*)::text as count FROM episode_logs WHERE user_id = $1",
    [userId],
  );
  const totalShowsResult = await db.one<{ count: string }>(
    "SELECT COUNT(*)::text as count FROM user_shows WHERE user_id = $1",
    [userId],
  );
  const watchingShowsResult = await db.one<{ count: string }>(
    "SELECT COUNT(*)::text as count FROM user_shows WHERE user_id = $1 AND status = 'watching'",
    [userId],
  );
  const watchedShowsResult = await db.one<{ count: string }>(
    "SELECT COUNT(*)::text as count FROM user_shows WHERE user_id = $1 AND status = 'watched'",
    [userId],
  );
  const wantToWatchResult = await db.one<{ count: string }>(
    "SELECT COUNT(*)::text as count FROM user_shows WHERE user_id = $1 AND status = 'want_to_watch'",
    [userId],
  );

  const totalEpisodes = Number(totalEpisodesResult?.count ?? 0);
  const totalShows = Number(totalShowsResult?.count ?? 0);
  const watchingShows = Number(watchingShowsResult?.count ?? 0);
  const watchedShows = Number(watchedShowsResult?.count ?? 0);
  const wantToWatch = Number(wantToWatchResult?.count ?? 0);

  return NextResponse.json({
    totalEpisodes,
    totalShows,
    watchingShows,
    watchedShows,
    wantToWatch,
  });
}
