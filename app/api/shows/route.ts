import { NextResponse } from "next/server";
import { defaultRateLimit } from "@/lib/core";
import { tmdbFetch } from "@/lib/tmdb";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = defaultRateLimit(request);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") ?? "1";
    const data = await tmdbFetch("/tv/popular", { page });
    return NextResponse.json(data);
  } catch (error) {
    console.error("TMDB popular shows error:", error);
    return NextResponse.json({ error: "Failed to fetch popular shows" }, { status: 500 });
  }
}
