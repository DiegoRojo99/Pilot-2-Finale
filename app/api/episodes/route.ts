import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  createEpisodeLogForUser,
  createEpisodeLogsBulkForUser,
  fetchEpisodeLogsForUser,
  fetchLatestEpisodeLogsForShow,
  userHasShowInList,
} from "@/lib/data/episode-logs";
import { readJson } from "@/lib/http";
import { defaultRateLimit } from "@/lib/rate-limit";
import { reconcileUserShowStatus } from "@/lib/user-show-status";
import { safeRecomputeAchievementProgressForUser } from "@/lib/achievements/progress";

export const runtime = "nodejs";

type EpisodeLogPayload = {
  tmdb_show_id?: number;
  tmdb_episode_id?: number | null;
  season_number?: number;
  episode_number?: number;
  episode_name?: string | null;
  rating?: number | null;
  notes?: string | null;
  watched_at?: string | null;
  episodes?: Array<{
    tmdb_episode_id?: number | null;
    season_number?: number;
    episode_number?: number;
    episode_name?: string | null;
    rating?: number | null;
    notes?: string | null;
    watched_at?: string | null;
  }>;
};

function normalizeRating(value: unknown): number | null | "invalid" {
  if (value === undefined || value === null || value === "") return null;

  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10) return "invalid";

  return parsed;
}

export async function GET(request: Request) {
  const rateLimited = defaultRateLimit(request);
  if (rateLimited) return rateLimited;

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) {
    return authResult.response;
  }
  const { userId } = authResult.context;

  const { searchParams } = new URL(request.url);
  const tmdbShowId = searchParams.get("tmdb_show_id");
  const withWatchDate = ["1", "true"].includes((searchParams.get("with_watch_date") ?? "").toLowerCase());
  const limitRaw = Number(searchParams.get("limit") ?? "50");
  const offsetRaw = Number(searchParams.get("offset") ?? "0");
  const limit = Number.isFinite(limitRaw) ? limitRaw : 50;
  const offset = Number.isFinite(offsetRaw) ? offsetRaw : 0;

  if (tmdbShowId) {
    const numericTmdbShowId = Number(tmdbShowId);
    if (!Number.isFinite(numericTmdbShowId)) {
      return NextResponse.json([]);
    }

    const logs = await fetchLatestEpisodeLogsForShow(userId, numericTmdbShowId, {
      withWatchDate,
      limit,
      offset,
    });

    return NextResponse.json(logs);
  }

  const logs = await fetchEpisodeLogsForUser(userId, { withWatchDate, limit, offset });

  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  const rateLimited = defaultRateLimit(request);
  if (rateLimited) return rateLimited;

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;
  const { userId } = authResult.context;
  const body = await readJson<EpisodeLogPayload>(request);
  if (!body?.tmdb_show_id || !Number.isFinite(body.tmdb_show_id)) {
    return NextResponse.json({ error: "tmdb_show_id is required" }, { status: 400 });
  }

  const tmdbShowId = Number(body.tmdb_show_id);
  const hasShow = await userHasShowInList(userId, tmdbShowId);
  if (!hasShow) return NextResponse.json({ error: "Show not in your list. Add it first." }, { status: 404 });
  const isBulk = Array.isArray(body.episodes);

  if (isBulk) {
    const episodes = body.episodes ?? [];
    if (episodes.length === 0) return NextResponse.json({ error: "episodes must contain at least one item" }, { status: 400 });

    const hasInvalidEpisode = episodes.some((episode) => episode.season_number === undefined || episode.episode_number === undefined);

    if (hasInvalidEpisode) {
      return NextResponse.json(
        { error: "Each episode requires season_number and episode_number" },
        { status: 400 },
      );
    }

    const normalizedEpisodes = episodes.map((episode) => {
      const normalizedRating = normalizeRating(episode.rating);
      return {
        ...episode,
        rating: normalizedRating === "invalid" ? episode.rating : normalizedRating,
      };
    });

    const hasInvalidRating = normalizedEpisodes.some((episode) => normalizeRating(episode.rating) === "invalid");

    if (hasInvalidRating) {
      return NextResponse.json({ error: "rating must be between 0 and 10" }, { status: 400 });
    }

    try {
      const count = await createEpisodeLogsBulkForUser(
        userId,
        tmdbShowId,
        normalizedEpisodes.map((episode) => ({
          tmdbEpisodeId: episode.tmdb_episode_id,
          seasonNumber: Number(episode.season_number),
          episodeNumber: Number(episode.episode_number),
          episodeName: episode.episode_name ?? null,
          rating: normalizeRating(episode.rating) as number | null,
          notes: episode.notes ?? null,
          watchedAt: episode.watched_at ?? null,
        })),
      );

      await reconcileUserShowStatus(userId, tmdbShowId);
      await safeRecomputeAchievementProgressForUser(userId);
      return NextResponse.json({ count }, { status: 201 });
    } 
    catch (error) {
      console.error("Error logging episodes in bulk:", error);
      return NextResponse.json({ error: "Failed to log episodes" }, { status: 500 });
    }
  }

  if (body.season_number === undefined || body.episode_number === undefined) {
    return NextResponse.json(
      { error: "tmdb_show_id, season_number, and episode_number are required" },
      { status: 400 },
    );
  }

  const normalizedRating = normalizeRating(body.rating);
  if (normalizedRating === "invalid") {
    return NextResponse.json({ error: "rating must be between 0 and 10" }, { status: 400 });
  }

  try {
    const log = await createEpisodeLogForUser(userId, {
      tmdbShowId,
      tmdbEpisodeId: body.tmdb_episode_id,
      seasonNumber: body.season_number,
      episodeNumber: body.episode_number,
      episodeName: body.episode_name ?? null,
      rating: normalizedRating,
      notes: body.notes ?? null,
      watchedAt: body.watched_at ?? null,
    });

    await reconcileUserShowStatus(userId, tmdbShowId);
    await safeRecomputeAchievementProgressForUser(userId);
    return NextResponse.json(log, { status: 201 });
  } 
  catch (error) {
    console.error("Error logging episode:", error);
    return NextResponse.json({ error: "Failed to log episode" }, { status: 500 });
  }
}
