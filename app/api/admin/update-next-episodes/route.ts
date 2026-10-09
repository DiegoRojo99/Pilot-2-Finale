import { NextResponse } from "next/server";
import { prisma, readJson, enforceRateLimit, getClientAddress } from "@/lib/core";
import { requireAdminUser } from "@/lib/auth/admin";
import { updateNextEpisodeToWatch, reconcileUserShowStatus } from "@/lib/shows";

export const runtime = "nodejs";

type UpdateNextEpisodesPayload = {
  cursor?: number | null;
  batch_size?: number;
};

/**
 * Cron job endpoint to update next episode for all user shows
 * This ensures that when new episodes are released, they're reflected immediately
 * without waiting for user action
 * 
 * Should be called daily via:
 * - Vercel cron jobs (recommended if hosting on Vercel)
 * - External cron scheduler (e.g., EasyCron, GitHub Actions, etc.)
 * - Self-hosted cron
 * 
 * Security:
 * - Vercel cron: Uses CRON_SECRET environment variable (automatic)
 * - External cron: Uses admin JWT token OR CRON_SECRET
 * 
 * Example usage:
 * POST /api/admin/update-next-episodes
 * Body: { "cursor": 0, "batch_size": 50 }
 * 
 * Headers (choose one):
 * - "Authorization: Bearer <ADMIN_JWT_TOKEN>" (for external cron)
 * - "Authorization: Bearer <CRON_SECRET>" (for external cron with secret)
 * - Automatic for Vercel cron jobs
 * 
 * Response includes nextCursor for pagination to process all shows in batches
 */
export async function POST(request: Request) {
  // Verify request is from Vercel cron or authorized admin
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  const hasValidAuth =
    (cronSecret && authHeader === `Bearer ${cronSecret}`); // Vercel cron / external cron with secret
  
  // If no Vercel cron and no valid secret, check for admin JWT
  if (!hasValidAuth) {
    const adminResult = await requireAdminUser();
    if ("response" in adminResult) return adminResult.response;
  }

  const rateLimited = enforceRateLimit({
    key: `api:cron-update-episodes`,
    windowMs: 60 * 60 * 1000, // Cron jobs need more lenient limits
    max: 480,
    message: "Too many requests, please try again later.",
  });

  if (rateLimited) return rateLimited;

  const body = await readJson<UpdateNextEpisodesPayload>(request);
  const cursor = Number.isFinite(body?.cursor) ? Number(body?.cursor) : 0;
  const batchSizeRaw = Number.isFinite(body?.batch_size) ? Number(body?.batch_size) : 50;
  const batchSize = Math.max(1, Math.min(100, batchSizeRaw));

  try {
    // Get all user shows in batches
    const userShows = await prisma.userShow.findMany({
      where: {
        id: {
          gt: cursor, // Pagination using ID cursor
        },
        status: {
          in: ["watching", "want_to_watch", "on_hold", "watched"], // "watched" so new episodes/wrong completions get re-evaluated
        },
      },
      select: {
        id: true,
        userId: true,
        tmdbId: true,
      },
      orderBy: {
        id: "asc",
      },
      take: batchSize,
    });

    if (userShows.length === 0) {
      return NextResponse.json({
        message: "No more shows to process",
        processedInBatch: 0,
        updatedInBatch: 0,
        failuresInBatch: 0,
        failures: [],
        nextCursor: null,
        hasMore: false,
      });
    }

    let updated = 0;
    const failures: Array<{ userId: string; tmdbId: number; error: string }> = [];

    for (const userShow of userShows) {
      try {
        // Syncs the episode catalog first, then picks the next released unwatched episode
        await updateNextEpisodeToWatch(userShow.userId, userShow.tmdbId);

        // Recomputes progress and fixes the status (e.g. wrongly "watched" shows)
        await reconcileUserShowStatus(userShow.userId, userShow.tmdbId);
        
        updated += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        failures.push({
          userId: userShow.userId,
          tmdbId: userShow.tmdbId,
          error: message,
        });
      }
    }

    const nextCursor = userShows.length > 0 ? userShows[userShows.length - 1]?.id ?? null : null;
    const hasMore = userShows.length === batchSize;

    return NextResponse.json({
      message: "Successfully updated next episodes",
      processedInBatch: userShows.length,
      updatedInBatch: updated,
      failuresInBatch: failures.length,
      failures,
      nextCursor: hasMore ? nextCursor : null,
      hasMore,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to update next episodes: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * Vercel cron jobs issue GET requests (with "Authorization: Bearer $CRON_SECRET"),
 * so walk every batch here instead of relying on a client-provided cursor.
 */
export async function GET(request: Request) {
  let cursor: number | null = 0;
  let processed = 0;
  let updated = 0;
  let failures = 0;

  while (cursor !== null) {
    const response: Response = await POST(
      new Request(request.url, {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify({ cursor, batch_size: 50 }),
      }),
    );

    if (!response.ok) return response;

    const result = (await response.json()) as {
      processedInBatch: number;
      updatedInBatch: number;
      failuresInBatch: number;
      nextCursor: number | null;
    };

    processed += result.processedInBatch;
    updated += result.updatedInBatch;
    failures += result.failuresInBatch;
    cursor = result.nextCursor;
  }

  return NextResponse.json({ message: "Cron completed", processed, updated, failures });
}

