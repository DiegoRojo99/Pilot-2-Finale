import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { fetchEpisodeBatchForUser } from "@/lib/data/episode-batch";
import { readJson } from "@/lib/http";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import type { EpisodeBatchResponse } from "@/types";

export const runtime = "nodejs";

type BatchEpisodeLogsPayload = {
  tmdb_show_ids?: number[];
};

export async function POST(request: Request) {
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

  const body = await readJson<BatchEpisodeLogsPayload>(request);
  const tmdbShowIds = (body?.tmdb_show_ids ?? [])
    .filter((value): value is number => Number.isFinite(value))
    .map((value) => Number(value));

  if (tmdbShowIds.length === 0) {
    return NextResponse.json({
      logsByShowId: {},
      progressByShowId: {},
    } satisfies EpisodeBatchResponse);
  }

  const result = await fetchEpisodeBatchForUser(userId, tmdbShowIds);
  return NextResponse.json(result satisfies EpisodeBatchResponse);
}
