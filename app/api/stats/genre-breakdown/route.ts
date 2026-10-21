import { NextResponse } from "next/server";
import { prisma, defaultRateLimit } from "@/lib/core";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";

export const runtime = "nodejs";

interface GenreBreakdown {
  genre: string;
  shows: number;
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
  Adventure: "#34d399",
  Mystery: "#8b5cf6",
  Crime: "#dc2626",
  War: "#64748b",
  Western: "#b45309",
  Historical: "#d97706",
  Musical: "#ec4899",
  Sport: "#06b6d4",
};

function generateColorFromGenre(genreName: string): string {
  if (GENRE_COLORS[genreName]) return GENRE_COLORS[genreName];

  // Generate a stable color based on genre name hash
  let hash = 0;
  for (let i = 0; i < genreName.length; i++) {
    hash = ((hash << 5) - hash) + genreName.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert hash to HSL color (more vibrant and varied)
  const hue = Math.abs(hash) % 360;
  const saturation = 65 + (Math.abs(hash) % 20);
  const lightness = 45 + (Math.abs(hash) % 15);

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export async function GET(request: Request) {
  const rateLimited = defaultRateLimit(request);
  if (rateLimited) return rateLimited;

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;

  const { userId } = authResult.context;

  try {
    // Get all user shows with their genres
    const userShows = await prisma.userShow.findMany({
      where: { userId },
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
    });

    // Count shows by genre (using Set to avoid duplicates)
    const genreShowSets: Record<string, Set<number>> = {};
    userShows.forEach((userShow) => {
      const genres = userShow.show.showGenres;

      // Do not add if no genre
      if (genres.length === 0) return;
      genres.forEach((sg) => {
        const genreName = sg.genre.name;
        if (!genreShowSets[genreName]) genreShowSets[genreName] = new Set();
        genreShowSets[genreName].add(userShow.show.tmdbId);
      });
    });

    // Convert to array and sort by show count
    const breakdown: GenreBreakdown[] = Object.entries(genreShowSets)
      .map(([genre, showSet]) => ({
        genre,
        shows: showSet.size,
        color: generateColorFromGenre(genre),
      }))
      .sort((a, b) => b.shows - a.shows);

    return NextResponse.json(breakdown);
  } catch (error) {
    console.error("Error fetching genre breakdown:", error);
    return NextResponse.json({ error: "Failed to fetch genre breakdown" }, { status: 500 });
  }
}
