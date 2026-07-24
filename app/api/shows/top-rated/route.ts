import { NextResponse } from "next/server";
import { defaultRateLimit } from "@/lib/rate-limit";
import { tmdbFetch } from "@/lib/tmdb";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = defaultRateLimit(request);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") ?? "1";
    const language = searchParams.get("language") ?? "en-US";
    const top_rated_constraints = {
        include_adult: "false",
        include_null_first_air_dates: "false",
        sort_by: "vote_average.desc",
        "vote_count.gte": "5000",
    }

    const data = await tmdbFetch("/discover/tv", { page, language, ...top_rated_constraints });
    return NextResponse.json(data);
  } 
  catch (error) {
    console.error("TMDB top rated shows error:", error);
    return NextResponse.json({ error: "Failed to fetch top rated shows" }, { status: 500 });
  }
}