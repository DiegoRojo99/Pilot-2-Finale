import { NextResponse } from "next/server";
import { isNumericId, defaultRateLimit } from "@/lib/core";
import { tmdbFetch } from "@/lib/tmdb";

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

    const data = await tmdbFetch(`/tv/${id}/season/${seasonNumber}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error("TMDB season error:", error);
    return NextResponse.json({ error: "Failed to fetch season details" }, { status: 500 });
  }
}
