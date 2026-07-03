import { NextResponse } from "next/server";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import { tmdbFetch } from "@/lib/tmdb";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit({
    key: `api:${getClientAddress(request)}`,
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many requests, please try again later.",
  });

  if (rateLimited) {
    return rateLimited;
  }

  try {
    const data = await tmdbFetch("/trending/tv/week");
    return NextResponse.json(data);
  } catch (error) {
    console.error("TMDB trending error:", error);
    return NextResponse.json({ error: "Failed to fetch trending shows" }, { status: 500 });
  }
}
