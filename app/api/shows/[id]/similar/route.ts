import { NextResponse } from "next/server";
import { isNumericId, defaultRateLimit } from "@/lib/core";
import { tmdbFetch } from "@/lib/tmdb";
import type { TMDBSearchResult } from "@/types/tmdb";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = defaultRateLimit(request);
  if (rateLimited) return rateLimited;

  try {
    const { id } = await params;
    if (!isNumericId(id)) return NextResponse.json({ error: "Invalid show ID" }, { status: 400 });

    const data = await tmdbFetch<TMDBSearchResult>(`/tv/${id}/recommendations?page=1`);
    if (!data.results) return NextResponse.json({ results: [], page: 1, total_pages: 0, total_results: 0 });
    return NextResponse.json(data);
  } 
  catch (error) {
    console.error("TMDB recommendations error:", error);
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}
