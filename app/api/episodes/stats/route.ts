import { NextResponse } from "next/server";
import db from "@/lib/db";
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

  const totalEpisodesResult = await db.one<{ count: string }>("SELECT COUNT(*)::text as count FROM episode_logs");
  const totalShowsResult = await db.one<{ count: string }>("SELECT COUNT(*)::text as count FROM user_shows");
  const watchingShowsResult = await db.one<{ count: string }>(
    "SELECT COUNT(*)::text as count FROM user_shows WHERE status = 'watching'",
  );
  const watchedShowsResult = await db.one<{ count: string }>(
    "SELECT COUNT(*)::text as count FROM user_shows WHERE status = 'watched'",
  );
  const wantToWatchResult = await db.one<{ count: string }>(
    "SELECT COUNT(*)::text as count FROM user_shows WHERE status = 'want_to_watch'",
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
