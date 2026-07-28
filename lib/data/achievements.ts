import { prisma } from "@/lib/prisma";
import type { UserAchievementProgressView, UserAchievementProgressWithAchievement } from "@/types";
import { recomputeAchievementProgressForUser } from "@/lib/achievements/progress";
import type { AchievementTier, Prisma } from "@prisma/client";

type AchievementTierRow = Prisma.AchievementTierGetPayload<{
  select: {
    id: true;
    name: true;
    level: true;
    requiredCount: true;
    colorToken: true;
  };
}>;

function mapTier(row: AchievementTierRow): UserAchievementProgressView["achievement"]["tiers"][number] {
  return {
    id: row.id,
    name: row.name,
    level: row.level,
    required_count: row.requiredCount,
    color_token: row.colorToken,
  };
}

export async function fetchUserAchievementProgress(userId: string): Promise<UserAchievementProgressView[]> {
  await recomputeAchievementProgressForUser(userId);

  const rows: UserAchievementProgressWithAchievement[] = await prisma.userAchievementProgress.findMany({
    where: {
      userId,
      achievement: {
        active: true,
      },
    },
    include: {
      currentTier: true,
      achievement: {
        include: {
          tiers: {
            orderBy: {
              requiredCount: "asc",
            },
          },
        },
      },
    },
    orderBy: [{ achievement: { sortOrder: "asc" } }, { achievementId: "asc" }],
  });

  return rows.map((row) => {
    const nextTier: AchievementTier | null = row.achievement.tiers.find((tier) => tier.requiredCount > row.currentCount) ?? null;

    return {
      achievement_id: row.achievementId,
      current_count: row.currentCount,
      progress_percent: row.progressPercent,
      highest_tier_level: row.highestTierLevel,
      unlocked_at: row.unlockedAt ? row.unlockedAt.toISOString() : null,
      current_tier: row.currentTier ? mapTier(row.currentTier) : null,
      next_tier: nextTier ? mapTier(nextTier) : null,
      achievement: {
        id: row.achievement.id,
        key: row.achievement.key,
        title: row.achievement.title,
        description: row.achievement.description,
        category: row.achievement.category as UserAchievementProgressView["achievement"]["category"],
        metric_type: row.achievement.metricType as UserAchievementProgressView["achievement"]["metric_type"],
        active: row.achievement.active,
        icon: row.achievement.icon,
        icon_kind:
          (row.achievement.iconKind as UserAchievementProgressView["achievement"]["icon_kind"] | undefined) ?? "name",
        sort_order: row.achievement.sortOrder,
        tiers: row.achievement.tiers.map(mapTier),
      },
    };
  });
}
