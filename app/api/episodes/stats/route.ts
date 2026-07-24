import { NextResponse } from "next/server";
import { fetchEpisodeStats, parseEpisodeStatsPeriod } from "@/lib/data/episode-stats";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit({
    key: `api:${getClientAddress(request)}`,
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many requests, please try again later.",
  });

  if (rateLimited) return rateLimited;
  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;
  
  const { userId } = authResult.context;
  const { searchParams } = new URL(request.url);
  const period = parseEpisodeStatsPeriod(searchParams.get("period"));
  const stats = await fetchEpisodeStats(userId, period);

  return NextResponse.json(stats);
}
