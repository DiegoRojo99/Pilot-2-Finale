import { NextResponse } from "next/server";
import { prisma, readJson, defaultRateLimit } from "@/lib/core";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { fetchUserShowByTmdbId, fetchUserShowsByUserId, upsertShowCatalog, refreshUserShowProgress, updateNextEpisodeToWatch } from "@/lib/shows";
import { recomputeAchievementProgressForUser } from "@/lib/achievements/progress";
import type { ShowStatus } from "@/types";

export const runtime = "nodejs";

const VALID_STATUSES: ShowStatus[] = ["watching", "want_to_watch", "watched", "dropped", "on_hold"];

type CreateShowPayload = {
  tmdb_id?: number;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string | null;
  first_air_date?: string | null;
  status?: ShowStatus;
  vote_average?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
};

export async function GET(request: Request) {
  const rateLimited = defaultRateLimit(request);
  if (rateLimited) return rateLimited;
  
  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;

  const { userId } = authResult.context;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  if (status && !VALID_STATUSES.includes(status as ShowStatus)) return NextResponse.json([]);

  // Fetch shows with updated next episode data
  const shows = await fetchUserShowsByUserId(userId, status ? (status as ShowStatus) : undefined, {
    preferUserNameWhenShowIsPlaceholder: true,
  });

  return NextResponse.json(shows);
}

export async function POST(request: Request) {
  const rateLimited = defaultRateLimit(request);

  if (rateLimited) return rateLimited;
  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;

  const { userId } = authResult.context;
  const body = await readJson<CreateShowPayload>(request);
  if (!body?.tmdb_id || !body.name) return NextResponse.json({ error: "tmdb_id and name are required" }, { status: 400 });

  const status = body.status ?? "watching";
  if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  try {
    await upsertShowCatalog({
      tmdb_id: body.tmdb_id,
      name: body.name,
      poster_path: body.poster_path ?? null,
      backdrop_path: body.backdrop_path ?? null,
      overview: body.overview ?? null,
      first_air_date: body.first_air_date ?? null,
      vote_average: body.vote_average ?? 0,
      number_of_seasons: body.number_of_seasons ?? 0,
      number_of_episodes: body.number_of_episodes ?? 0,
    });
    
    await prisma.userShow.upsert({
      where: {
        userId_tmdbId: {
          userId,
          tmdbId: body.tmdb_id,
        },
      },
      create: {
        userId,
        tmdbId: body.tmdb_id,
        status,
      },
      update: {
        status,
        updatedAt: new Date(),
      },
    });

    await updateNextEpisodeToWatch(userId, body.tmdb_id);
    await refreshUserShowProgress(userId, body.tmdb_id);
    await recomputeAchievementProgressForUser(userId);

    const show = await fetchUserShowByTmdbId(userId, body.tmdb_id, {
      preferUserNameWhenShowIsPlaceholder: true,
    });

    if (!show) return NextResponse.json({ error: "Failed to add show" }, { status: 500 });
    return NextResponse.json(show, { status: 201 });
  } catch (error) {
    console.error("Error adding show:", error);
    return NextResponse.json({ error: "Failed to add show" }, { status: 500 });
  }
}
