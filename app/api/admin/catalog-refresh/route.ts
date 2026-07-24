import { NextResponse } from "next/server";
import { fetchShowCount, fetchShowIdsPageAfterCursor } from "@/lib/data/admin-catalog-refresh";
import { readJson } from "@/lib/http";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import { requireAdminUser } from "@/lib/auth/admin";
import { fetchAndStoreShowCatalog } from "@/lib/show-catalog";

export const runtime = "nodejs";

type CatalogRefreshPayload = {
  cursor?: number | null;
  batch_size?: number;
};

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit({
    key: `api:${getClientAddress(request)}`,
    windowMs: 15 * 60 * 1000,
    max: 120,
    message: "Too many requests, please try again later.",
  });

  if (rateLimited) return rateLimited;

  const adminResult = await requireAdminUser();
  if ("response" in adminResult) return adminResult.response;

  const body = await readJson<CatalogRefreshPayload>(request);
  const cursor = Number.isFinite(body?.cursor) ? Number(body?.cursor) : 0;
  const batchSizeRaw = Number.isFinite(body?.batch_size) ? Number(body?.batch_size) : 20;
  const batchSize = Math.max(1, Math.min(50, batchSizeRaw));

  const totalShows = await fetchShowCount();
  const showIds = await fetchShowIdsPageAfterCursor(cursor, batchSize);

  let refreshed = 0;
  const failures: Array<{ tmdbId: number; error: string }> = [];

  for (const tmdbId of showIds) {
    try {
      await fetchAndStoreShowCatalog(tmdbId, { allowNameUpdate: true });
      refreshed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      failures.push({ tmdbId, error: message });
    }
  }

  const nextCursor = showIds.length > 0 ? showIds[showIds.length - 1] ?? null : null;
  const hasMore = showIds.length === batchSize;

  return NextResponse.json({
    totalShows,
    processedInBatch: showIds.length,
    refreshedInBatch: refreshed,
    failedInBatch: failures.length,
    failures,
    nextCursor: hasMore ? nextCursor : null,
    hasMore,
  });
}
