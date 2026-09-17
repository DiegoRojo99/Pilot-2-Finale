import { NextResponse } from "next/server";
import { isNumericId, defaultRateLimit } from "@/lib/core";
import { tmdbFetch } from "@/lib/tmdb";

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

    const data = await tmdbFetch(`/tv/${id}`, {
      append_to_response: "content_ratings,external_ids",
    });

    return NextResponse.json(data);
  } 
  catch (error) {
    console.error("TMDB show details error:", error);
    return NextResponse.json({ error: "Failed to fetch show details" }, { status: 500 });
  }
}
