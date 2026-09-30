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
  const daysAhead = parseInt(searchParams.get("days") ?? "30", 10);
  const status = searchParams.get("status"); // Optional filter by show status
  const sortBy = (searchParams.get("sortBy") ?? "date") as "date" | "show"; // 'date' or 'show'
  
  try {
    // Get user's tracked shows
    let userShowsQuery: Parameters<typeof prisma.userShow.findMany>[0] = {
      where: { userId },
      select: {
        id: true,
        tmdbId: true,
        name: true,
        status: true,
      },
    };

    if (status) {
      userShowsQuery.where = {
        ...userShowsQuery.where,
        status,
      };
    }

    const userShows = await prisma.userShow.findMany(userShowsQuery);

    if (userShows.length === 0) {
      return NextResponse.json({
        episodes: [],
        total: 0,
      });
    }

    const showIds = userShows.map((s) => s.tmdbId);

    // Calculate date range for upcoming episodes
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const futureDate = new Date(today);
    futureDate.setUTCDate(futureDate.getUTCDate() + daysAhead);

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

    // Filter to unreleased episodes within date range
    const upcomingEpisodes: UpcomingEpisode[] = episodes
      .filter((ep) => {
        if (!ep.airDate) return false;
        
        const epDate = new Date(ep.airDate);
        epDate.setUTCHours(0, 0, 0, 0);
        
        // Check if it's unreleased
        if (!isEpisodeUnreleased({ air_date: ep.airDate } as any)) {
          return false;
        }
        
        // Check if it's within the date range
        return epDate <= futureDate;
      })
      .map((ep) => {
        const userShow = userShows.find((s) => s.tmdbId === ep.tmdbShowId);
        return {
          id: ep.id,
          showId: ep.tmdbShowId,
          showName: userShow?.name ?? "Unknown Show",
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
    if (sortBy === "show") {
      upcomingEpisodes.sort((a, b) => a.showName.localeCompare(b.showName));
    }
    // Default 'date' sorting is already applied in the query

    return NextResponse.json({
      episodes: upcomingEpisodes,
      total: upcomingEpisodes.length,
    });
  } catch (error) {
    console.error("[UPCOMING_EPISODES_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming episodes" },
      { status: 500 }
    );
  }
}
