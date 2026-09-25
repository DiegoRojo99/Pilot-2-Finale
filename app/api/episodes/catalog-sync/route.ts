import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { readJson, enforceRateLimit, getClientAddress } from "@/lib/core";
import { syncShowEpisodeCatalog } from "@/lib/episodes";
import { reconcileUserShowStatus } from "@/lib/shows";

export const runtime = "nodejs";

type CatalogSyncPayload = {
  tmdb_show_ids?: number[];
};

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit({
    key: `api:${getClientAddress(request)}`,
    windowMs: 15 * 60 * 1000,
    max: 120,
    message: "Too many requests, please try again later.",
  });

  if (rateLimited) return rateLimited;
  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;
  const { userId } = authResult.context;

  const body = await readJson<CatalogSyncPayload>(request);
  const tmdbShowIds = (body?.tmdb_show_ids ?? [])
    .filter((value): value is number => Number.isFinite(value))
    .map((value) => Number(value));

  if (tmdbShowIds.length === 0) return NextResponse.json({ results: [] });
  const limitedIds = tmdbShowIds.slice(0, 10);
  const results = [] as Array<{
    tmdbShowId: number;
    synced: boolean;
    reason: string;
    expectedEpisodes: number;
    knownEpisodes: number;
  }>;

  for (const tmdbShowId of limitedIds) {
    try {
      const result = await syncShowEpisodeCatalog(tmdbShowId);
      await reconcileUserShowStatus(userId, tmdbShowId);
      results.push(result);
    } catch (error) {
      console.error("[episodes/catalog-sync] failed", { tmdbShowId, error });
      results.push({
        tmdbShowId,
        synced: false,
        reason: "sync_error",
        expectedEpisodes: 0,
        knownEpisodes: 0,
      });
    }
  }

  return NextResponse.json({ results });
}
