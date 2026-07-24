import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";

type StatsPeriod = "l7d" | "l30d" | "ly";

const PERIOD_TO_INTERVAL: Record<StatsPeriod, string> = {
  l7d: "7 days",
  l30d: "30 days",
  ly: "1 year",
};

function parsePeriod(value: string | null): StatsPeriod {
  if (value === "l7d" || value === "l30d" || value === "ly") return value;
  return "l30d";
}

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
  const { searchParams } = new URL(request.url);
  const period = parsePeriod(searchParams.get("period"));
  const interval = PERIOD_TO_INTERVAL[period];

  const stats = await db.one<{
    total_episodes: number;
    total_shows: number;
    watching_shows: number;
    watched_shows: number;
    want_to_watch: number;
    pending_episodes_watching: number;
    pending_runtime_minutes_watching: number;
  }>(
    `
      SELECT
        (SELECT COUNT(*)::int FROM watch_entries WHERE user_id = $1) AS total_episodes,
        COUNT(*)::int AS total_shows,
        COUNT(*) FILTER (WHERE status = 'watching')::int AS watching_shows,
        COUNT(*) FILTER (WHERE status = 'watched')::int AS watched_shows,
        COUNT(*) FILTER (WHERE status = 'want_to_watch')::int AS want_to_watch,
        COALESCE(SUM(CASE WHEN status = 'watching' THEN remaining_episodes_count ELSE 0 END), 0)::int AS pending_episodes_watching,
        COALESCE(SUM(CASE WHEN status = 'watching' THEN remaining_runtime_minutes ELSE 0 END), 0)::int AS pending_runtime_minutes_watching
      FROM user_shows
      WHERE user_id = $1
    `,
    [userId],
  );

  const periodRuntime = await db.one<{ time_spent_minutes: number }>(
    `
      SELECT COALESCE(SUM(COALESCE(e.runtime, 0)), 0)::int AS time_spent_minutes
      FROM watch_entries we
      JOIN episodes e ON e.id = we.episode_id
      WHERE we.user_id = $1
        AND COALESCE(we.watched_at, we.created_at) >= now() - $2::interval
    `,
    [userId, interval],
  );

  return NextResponse.json({
    period,
    totalEpisodes: stats?.total_episodes ?? 0,
    totalShows: stats?.total_shows ?? 0,
    watchingShows: stats?.watching_shows ?? 0,
    watchedShows: stats?.watched_shows ?? 0,
    wantToWatch: stats?.want_to_watch ?? 0,
    timeSpentMinutes: periodRuntime?.time_spent_minutes ?? 0,
    pendingEpisodesWatching: stats?.pending_episodes_watching ?? 0,
    pendingRuntimeMinutesWatching: stats?.pending_runtime_minutes_watching ?? 0,
  });
}
