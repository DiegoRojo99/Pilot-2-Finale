import { NextResponse } from "next/server";
import { fetchEpisodeStats, parseEpisodeStatsPeriod } from "@/lib/episodes";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { defaultRateLimit } from "@/lib/core";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = defaultRateLimit(request);
  if (rateLimited) return rateLimited;
  
  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;
  
  const { userId } = authResult.context;
  const { searchParams } = new URL(request.url);
  const period = parseEpisodeStatsPeriod(searchParams.get("period"));
  const stats = await fetchEpisodeStats(userId, period);

  return NextResponse.json(stats);
}
