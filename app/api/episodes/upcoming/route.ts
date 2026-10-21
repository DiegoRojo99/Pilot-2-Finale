import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/core";
import { isEpisodeUnreleased } from "@/lib/episodes";
import { defaultRateLimit } from "@/lib/core";

export const runtime = "nodejs";

interface UpcomingEpisode {
  id: number;
  showId: number;
  showName: string;
  showPosterPath: string | null;
  showBackdropPath: string | null;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  airDate: string;
  overview: string | null;
  stillPath: string | null;
  userShowStatus: string;
}

export async function GET(request: Request) {
  const rateLimited = defaultRateLimit(request);
  if (rateLimited) return rateLimited;

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;
  const { userId } = authResult.context;

  const { searchParams } = new URL(request.url);
  
  // Query parameters
  const status = searchParams.get("status"); // Optional filter by show status
  const sortBy = (searchParams.get("sortBy") ?? "date") as "date" | "show"; // 'date' or 'show'
  
  try {
    // Get user's tracked shows with their Show data
    const userShows = await prisma.userShow.findMany({
      where: { userId, ...(status && { status }) },
      include: {
        show: {
          select: {
            name: true,
            posterPath: true,
            backdropPath: true,
          },
        },
      },
    });

    if (userShows.length === 0) {
      return NextResponse.json({
        episodes: [],
        total: 0,
      });
    }

    const showIds = userShows.map((s) => s.tmdbId);

    // Calculate today's date for comparison
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Fetch all episodes for these shows
    const episodes = await prisma.episode.findMany({
      where: {
        tmdbShowId: {
          in: showIds,
        },
        airDate: {
          not: null,
        },
      },
      select: {
        id: true,
        tmdbShowId: true,
        seasonNumber: true,
        episodeNumber: true,
        name: true,
        airDate: true,
        overview: true,
        stillPath: true,
      },
      orderBy: {
        airDate: "asc",
      },
    });

    // Filter to unreleased episodes (all future episodes)
    const upcomingEpisodes: UpcomingEpisode[] = episodes
      .filter((ep) => {
        if (!ep.airDate) return false;
        
        // Check if it's unreleased
        return isEpisodeUnreleased({ air_date: ep.airDate } as any);
      })
      .map((ep) => {
        const userShow = userShows.find((s) => s.tmdbId === ep.tmdbShowId);
        const showName = userShow?.show.name ?? "Unknown Show";
        return {
          id: ep.id,
          showId: ep.tmdbShowId,
          showName,
          showPosterPath: userShow?.show.posterPath ?? null,
          showBackdropPath: userShow?.show.backdropPath ?? null,
          seasonNumber: ep.seasonNumber,
          episodeNumber: ep.episodeNumber,
          title: ep.name ?? `S${ep.seasonNumber}E${ep.episodeNumber}`,
          airDate: ep.airDate!,
          overview: ep.overview,
          stillPath: ep.stillPath,
          userShowStatus: userShow?.status ?? "unknown",
        };
      });

    // Sort based on sortBy parameter
    if (sortBy === "show") upcomingEpisodes.sort((a, b) => a.showName.localeCompare(b.showName));

    return NextResponse.json({
      episodes: upcomingEpisodes,
      total: upcomingEpisodes.length,
    });
  } 
  catch (error) {
    console.error("[UPCOMING_EPISODES_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming episodes" },
      { status: 500 }
    );
  }
}
