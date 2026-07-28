import { NextResponse } from "next/server";
import { defaultRateLimit } from "@/lib/rate-limit";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { fetchUserAchievementProgress } from "@/lib/data/achievements";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = defaultRateLimit(request);
  if (rateLimited) return rateLimited;

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;

  const { userId } = authResult.context;
  const achievements = await fetchUserAchievementProgress(userId);

  return NextResponse.json(achievements);
}
