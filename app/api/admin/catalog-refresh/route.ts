import { NextResponse } from "next/server";
import db from "@/lib/db";
import { readJson } from "@/lib/http";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import { requireAdminUser } from "@/lib/auth/admin";
import { fetchAndStoreShowCatalog } from "@/lib/show-catalog";

export const runtime = "nodejs";

type CatalogRefreshPayload = {
  cursor?: number | null;
  batch_size?: number;
};

type ShowIdRow = {
  tmdb_id: number;
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

  const totalRow = await db.one<{ count: number }>("SELECT COUNT(*)::int AS count FROM shows");
  const totalShows = totalRow?.count ?? 0;

  const { rows } = await db.query<ShowIdRow>(
    `
      SELECT tmdb_id
      FROM shows
      WHERE tmdb_id > $1
      ORDER BY tmdb_id ASC
      LIMIT $2
    `,
    [cursor, batchSize],
  );

  let refreshed = 0;
  const failures: Array<{ tmdbId: number; error: string }> = [];

  for (const row of rows) {
    try {
      await fetchAndStoreShowCatalog(row.tmdb_id, { allowNameUpdate: true });
      refreshed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      failures.push({ tmdbId: row.tmdb_id, error: message });
    }
  }

  const nextCursor = rows.length > 0 ? rows[rows.length - 1]?.tmdb_id ?? null : null;
  const hasMore = rows.length === batchSize;

  return NextResponse.json({
    totalShows,
    processedInBatch: rows.length,
    refreshedInBatch: refreshed,
    failedInBatch: failures.length,
    failures,
    nextCursor: hasMore ? nextCursor : null,
    hasMore,
  });
}
