import { NextResponse } from "next/server";
import { defaultRateLimit } from "@/lib/core";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { fetchUserAchievementProgress } from "@/lib/data/achievements";
import { safeRecomputeAchievementProgressForUser } from "@/lib/achievements/progress";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = defaultRateLimit(request);
  if (rateLimited) return rateLimited;

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;

  const { userId } = authResult.context;
  
  // Recalculate achievements on-demand when fetched
  // This ensures fresh data without blocking every mutation
  await safeRecomputeAchievementProgressForUser(userId);
  
  const achievements = await fetchUserAchievementProgress(userId);

  return NextResponse.json(achievements);
}
