import { NextResponse } from "next/server";
import { isNumericId, defaultRateLimit } from "@/lib/core";
import { tmdbFetch } from "@/lib/tmdb";
import { decorateEpisodesWithReleaseStatus } from "@/lib/episodes";
import type { TMDBSeason } from "@/types/tmdb";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; seasonNumber: string }> },
) {
  const rateLimited = defaultRateLimit(request);
  if (rateLimited) return rateLimited;

  try {
    const { id, seasonNumber } = await params;

    if (!isNumericId(id) || !isNumericId(seasonNumber)) {
      return NextResponse.json({ error: "Invalid show ID or season number" }, { status: 400 });
    }

    // Fetch season data
    const data = await tmdbFetch<TMDBSeason>(`/tv/${id}/season/${seasonNumber}?append_to_response=credits`);
    
    // Also fetch show cast for episodes
    const showData = await tmdbFetch<any>(`/tv/${id}?append_to_response=credits`);
    const showCast = showData.credits?.cast?.slice(0, 20) || [];
    
    if (!data.episodes) return NextResponse.json({ error: "No episodes found for this season" }, { status: 404 });
    if (!Array.isArray(data.episodes)) return NextResponse.json({ error: "Invalid episodes data for this season" }, { status: 404 });
    if (data.episodes.length === 0) return NextResponse.json({ error: "No episodes found for this season" }, { status: 404 });
    
    // Add show cast to each episode and remove guest_stars
    data.episodes = data.episodes.map((ep: any) => {
      const { guest_stars, ...episodeWithoutGuests } = ep;
      return {
        ...episodeWithoutGuests,
        cast: showCast,
      };
    });
    
    // Decorate episodes with release status
    data.episodes = decorateEpisodesWithReleaseStatus(data.episodes);
    return NextResponse.json(data);
  } 
  catch (error) {
    console.error("TMDB season error:", error);
    return NextResponse.json({ error: "Failed to fetch season details" }, { status: 500 });
  }
}
