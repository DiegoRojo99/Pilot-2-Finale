import { NextResponse } from "next/server";
import { prisma, defaultRateLimit } from "@/lib/core";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";

export const runtime = "nodejs";

interface GenreBreakdown {
  genre: string;
  episodes: number;
  color: string;
}

const GENRE_COLORS: Record<string, string> = {
  Comedy: "#fbbf24",
  Drama: "#f87171",
  "Sci-Fi": "#60a5fa",
  Fantasy: "#c084fc",
  Horror: "#991b1b",
  Thriller: "#7c3aed",
  Romance: "#ec4899",
  Action: "#ef4444",
  Documentary: "#34d399",
  Animation: "#f59e0b",
};

export async function GET(request: Request) {
  const rateLimited = defaultRateLimit(request);
  if (rateLimited) return rateLimited;

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;

  const { userId } = authResult.context;

  try {
    // Get all episode logs for this user to count episodes per genre
    const episodeLogs = await prisma.watchEntry.findMany({
      where: { userId },
      include: {
        episode: {
          include: {
            show: {
              include: {
                showGenres: {
                  include: {
                    genre: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Count episodes by genre
    const genreEpisodeCounts: Record<string, number> = {};

    episodeLogs.forEach((log) => {
      const genres = log.episode.show.showGenres;
      if (genres.length === 0) {
        // Fallback to Drama if no genres
        genreEpisodeCounts["Drama"] = (genreEpisodeCounts["Drama"] || 0) + 1;
      } else {
        genres.forEach((sg) => {
          const genreName = sg.genre.name;
          genreEpisodeCounts[genreName] = (genreEpisodeCounts[genreName] || 0) + 1;
        });
      }
    });

    // Convert to array and sort by episode count
    const breakdown: GenreBreakdown[] = Object.entries(genreEpisodeCounts)
      .map(([genre, episodes]) => ({
        genre,
        episodes,
        color: GENRE_COLORS[genre] || "#6366f1",
      }))
      .sort((a, b) => b.episodes - a.episodes);

    return NextResponse.json(breakdown);
  } catch (error) {
    console.error("Error fetching genre breakdown:", error);
    return NextResponse.json({ error: "Failed to fetch genre breakdown" }, { status: 500 });
  }
}
