import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/core";

export const runtime = "nodejs";

export async function DELETE() {
  const authResult = await requireAuthenticatedUser();

  if ("response" in authResult) {
    return authResult.response;
  }

  const { userId } = authResult.context;

  const [deletionRequest, watchEntries, userShows, achievementProgress] = await prisma.$transaction([
    prisma.accountDeletionRequest.create({ data: { userId } }),
    prisma.watchEntry.deleteMany({ where: { userId } }),
    prisma.userShow.deleteMany({ where: { userId } }),
    prisma.userAchievementProgress.deleteMany({ where: { userId } }),
  ]);

  return NextResponse.json({
    success: true,
    deletionRequestId: deletionRequest.id,
    deleted: {
      watchEntries: watchEntries.count,
      userShows: userShows.count,
      achievementProgress: achievementProgress.count,
    },
  });
}