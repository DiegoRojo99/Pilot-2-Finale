import { NextResponse } from "next/server";
import { prisma, readJson, enforceRateLimit, getClientAddress } from "@/lib/core";
import { requireAdminUser } from "@/lib/auth/admin";
import { updateNextEpisodeToWatch, refreshUserShowProgress } from "@/lib/shows";

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
  const isVercelCron = request.headers.get("x-vercel-cron") === "true";
  
  const hasValidAuth = 
    isVercelCron || // Vercel cron is automatically authorized
    (cronSecret && authHeader === `Bearer ${cronSecret}`); // External cron with secret
  
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
          in: ["watching", "want_to_watch", "on_hold"], // Only update shows user is actively tracking
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
        // Refresh show progress to get accurate remaining episode count
        await refreshUserShowProgress(userShow.userId, userShow.tmdbId);
        
        // Update the next episode to watch based on current watch history and released episodes
        await updateNextEpisodeToWatch(userShow.userId, userShow.tmdbId);
        
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
