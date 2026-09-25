import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { fetchLatestEpisodeLogsForShow } from "@/lib/episodes"
import { defaultRateLimit } from "@/lib/core"

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tmdbShowId: string }> },
) {
  const rateLimited = defaultRateLimit(request);
  if (rateLimited) return rateLimited;

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;

  const { userId } = authResult.context;
  const { tmdbShowId } = await params;
  const logs = await fetchLatestEpisodeLogsForShow(userId, Number(tmdbShowId));

  return NextResponse.json(logs);
}
