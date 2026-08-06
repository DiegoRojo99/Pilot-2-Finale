import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  deleteEpisodeLogsForShowSeasonEpisode,
  fetchEpisodeLogsForShowSeasonEpisode,
} from "@/lib/data/episode-logs";
import { safeRecomputeAchievementProgressForUser } from "@/lib/achievements/progress";
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
  const logs = await fetchEpisodeLogsForShowSeasonEpisode(
    userId,
    Number(tmdbShowId),
    Number(season),
    Number(episode),
  );

  return NextResponse.json(logs);
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
  const numericTmdbShowId = Number(tmdbShowId);
  const deletedCount = await deleteEpisodeLogsForShowSeasonEpisode(
    userId,
    numericTmdbShowId,
    Number(season),
    Number(episode),
  );

  if (deletedCount === 0) return NextResponse.json({ error: "Episode log not found" }, { status: 404 });
  await reconcileUserShowStatus(userId, numericTmdbShowId);
  await safeRecomputeAchievementProgressForUser(userId);
  return NextResponse.json({ success: true });
}
