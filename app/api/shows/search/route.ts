import { NextResponse } from "next/server";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import { tmdbFetch } from "@/lib/tmdb";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const address = getClientAddress(request);

  const apiRateLimit = enforceRateLimit({
    key: `api:${address}`,
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many requests, please try again later.",
  });

  if (apiRateLimit) {
    return apiRateLimit;
  }

  const searchRateLimit = enforceRateLimit({
    key: `search:${address}`,
    windowMs: 60 * 1000,
    max: 30,
    message: "Too many search requests, please slow down.",
  });

  if (searchRateLimit) {
    return searchRateLimit;
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const page = searchParams.get("page") ?? "1";

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
    }

    const data = await tmdbFetch("/search/tv", {
      query,
      page,
      include_adult: false,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("TMDB search error:", error);
    return NextResponse.json({ error: "Failed to search shows" }, { status: 500 });
  }
}
