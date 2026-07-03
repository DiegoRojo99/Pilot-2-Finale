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

  const totalEpisodes = (db.prepare("SELECT COUNT(*) as count FROM episode_logs").get() as { count: number }).count;
  const totalShows = (db.prepare("SELECT COUNT(*) as count FROM user_shows").get() as { count: number }).count;
  const watchingShows = (
    db.prepare("SELECT COUNT(*) as count FROM user_shows WHERE status = 'watching'").get() as { count: number }
  ).count;
  const watchedShows = (
    db.prepare("SELECT COUNT(*) as count FROM user_shows WHERE status = 'watched'").get() as { count: number }
  ).count;
  const wantToWatch = (
    db.prepare("SELECT COUNT(*) as count FROM user_shows WHERE status = 'want_to_watch'").get() as { count: number }
  ).count;

  return NextResponse.json({
    totalEpisodes,
    totalShows,
    watchingShows,
    watchedShows,
    wantToWatch,
  });
}
