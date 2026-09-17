import { prisma } from "@/lib/core";
import { ACHIEVEMENT_DEFINITIONS } from "@/lib/achievements/definitions";

const WATCHLIST_TO_WATCHED_KEY = "watchlist_to_watched_total";

type MetricMap = Record<string, number>;

type TierInfo = {
  id: number;
  level: number;
  requiredCount: number;
};

type TierProgress = {
  currentTierId: number | null;
  currentTierLevel: number;
  progressPercent: number;
};

function isAchievementTableMissingError(error: unknown) {
  if (!(error instanceof Error)) return false;

  return (
    error.message.includes("P2021") ||
    error.message.includes("achievements") ||
    error.message.includes("achievement_tiers") ||
    error.message.includes("user_achievement_progress")
  );
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveTierProgress(tiers: TierInfo[], currentCount: number): TierProgress {
  if (tiers.length === 0) {
    return {
      currentTierId: null,
      currentTierLevel: 0,
      progressPercent: 0,
    };
  }

  const sorted = [...tiers].sort((a, b) => a.requiredCount - b.requiredCount);
  let currentTier: TierInfo | null = null;

  for (const tier of sorted) {
    if (currentCount >= tier.requiredCount) {
      currentTier = tier;
      continue;
    }

    break;
  }

  if (!currentTier) {
    const first = sorted[0];
    const percent = first.requiredCount <= 0 ? 100 : clampPercent((currentCount / first.requiredCount) * 100);

    return {
      currentTierId: null,
      currentTierLevel: 0,
      progressPercent: percent,
    };
  }

  const nextTier = sorted.find((tier) => tier.requiredCount > currentTier.requiredCount) ?? null;

  if (!nextTier) {
    return {
      currentTierId: currentTier.id,
      currentTierLevel: currentTier.level,
      progressPercent: 100,
    };
  }

  const span = Math.max(1, nextTier.requiredCount - currentTier.requiredCount);
  const progressWithinTier = clampPercent(((currentCount - currentTier.requiredCount) / span) * 100);

  return {
    currentTierId: currentTier.id,
    currentTierLevel: currentTier.level,
    progressPercent: progressWithinTier,
  };
}

async function syncAchievementCatalog() {
  for (const definition of ACHIEVEMENT_DEFINITIONS) {
    const achievement = await prisma.achievement.upsert({
      where: {
        key: definition.key,
      },
      create: {
        key: definition.key,
        title: definition.title,
        description: definition.description,
        category: definition.category,
        metricType: definition.metricType,
        active: true,
        icon: definition.icon,
        iconKind: definition.iconKind,
        sortOrder: definition.sortOrder,
      },
      update: {
        title: definition.title,
        description: definition.description,
        category: definition.category,
        metricType: definition.metricType,
        active: true,
        icon: definition.icon,
        iconKind: definition.iconKind,
        sortOrder: definition.sortOrder,
        updatedAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    for (const tier of definition.tiers) {
      await prisma.achievementTier.upsert({
        where: {
          achievementId_level: {
            achievementId: achievement.id,
            level: tier.level,
          },
        },
        create: {
          achievementId: achievement.id,
          name: tier.name,
          level: tier.level,
          requiredCount: tier.requiredCount,
          colorToken: tier.colorToken,
        },
        update: {
          name: tier.name,
          requiredCount: tier.requiredCount,
          colorToken: tier.colorToken,
          updatedAt: new Date(),
        },
      });
    }
  }
}

async function fetchWatchlistToWatchedStoredCount(userId: string) {
  const row = await prisma.userAchievementProgress.findFirst({
    where: {
      userId,
      achievement: {
        key: WATCHLIST_TO_WATCHED_KEY,
      },
    },
    select: {
      currentCount: true,
    },
  });

  return row?.currentCount ?? 0;
}

async function buildMetricsForUser(userId: string): Promise<MetricMap> {
  const [
    totalEpisodeLogs,
    watchedShows,
    ratedEpisodeLogs,
    uniqueEpisodes,
    watchlistToWatchedStoredCount,
    bestDayRows,
    activeDaysRows,
    watchedMinutesRows,
    seasonsCompletedRows,
    genresRows,
  ] = await Promise.all([
    prisma.watchEntry.count({
      where: {
        userId,
      },
    }),
    prisma.userShow.count({
      where: {
        userId,
        status: "watched",
      },
    }),
    prisma.watchEntry.count({
      where: {
        userId,
        rating: {
          not: null,
        },
      },
    }),
    prisma.watchEntry.findMany({
      where: {
        userId,
      },
      select: {
        episodeId: true,
      },
      distinct: ["episodeId"],
    }),
    fetchWatchlistToWatchedStoredCount(userId),
    prisma.$queryRaw<Array<{ best_day: number | null }>>`
      WITH grouped AS (
        SELECT
          DATE(COALESCE(watched_at, created_at)) AS day,
          COUNT(*)::int AS daily_count
        FROM watch_entries
        WHERE user_id = ${userId}
        GROUP BY DATE(COALESCE(watched_at, created_at))
      )
      SELECT COALESCE(MAX(daily_count), 0)::int AS best_day
      FROM grouped
    `,
    prisma.$queryRaw<Array<{ active_days: number | null }>>`
      SELECT COUNT(DISTINCT DATE(COALESCE(watched_at, created_at)))::int AS active_days
      FROM watch_entries
      WHERE user_id = ${userId}
    `,
    prisma.$queryRaw<Array<{ minutes_total: number | null }>>`
      WITH latest_unique AS (
        SELECT DISTINCT ON (we.user_id, we.episode_id)
          we.episode_id,
          COALESCE(e.runtime, 0)::int AS runtime
        FROM watch_entries we
        JOIN episodes e ON e.id = we.episode_id
        WHERE we.user_id = ${userId}
        ORDER BY we.user_id, we.episode_id, we.watched_at DESC NULLS LAST, we.created_at DESC, we.id DESC
      )
      SELECT COALESCE(SUM(runtime), 0)::int AS minutes_total
      FROM latest_unique
    `,
    prisma.$queryRaw<Array<{ seasons_completed: number | null }>>`
      WITH episodes_per_season AS (
        SELECT
          e.tmdb_show_id,
          e.season_number,
          COUNT(*)::int AS total_episodes
        FROM episodes e
        GROUP BY e.tmdb_show_id, e.season_number
      ),
      watched_per_season AS (
        SELECT
          e.tmdb_show_id,
          e.season_number,
          COUNT(DISTINCT we.episode_id)::int AS watched_episodes
        FROM watch_entries we
        JOIN episodes e ON e.id = we.episode_id
        WHERE we.user_id = ${userId}
        GROUP BY e.tmdb_show_id, e.season_number
      )
      SELECT COUNT(*)::int AS seasons_completed
      FROM episodes_per_season eps
      JOIN watched_per_season wps
        ON eps.tmdb_show_id = wps.tmdb_show_id
       AND eps.season_number = wps.season_number
      WHERE eps.total_episodes > 0
        AND wps.watched_episodes >= eps.total_episodes
    `,
    prisma.$queryRaw<Array<{ distinct_genres: number | null }>>`
      SELECT COUNT(DISTINCT sg.genre_id)::int AS distinct_genres
      FROM watch_entries we
      JOIN episodes e ON e.id = we.episode_id
      JOIN show_genres sg ON sg.show_tmdb_id = e.tmdb_show_id
      WHERE we.user_id = ${userId}
    `,
  ]);

  return {
    episodes_watched_total: totalEpisodeLogs,
    shows_completed_total: watchedShows,
    seasons_completed_total: seasonsCompletedRows[0]?.seasons_completed ?? 0,
    minutes_watched_total: watchedMinutesRows[0]?.minutes_total ?? 0,
    episodes_watched_best_day: bestDayRows[0]?.best_day ?? 0,
    active_days_total: activeDaysRows[0]?.active_days ?? 0,
    watchlist_to_watched_total: watchlistToWatchedStoredCount,
    distinct_genres_watched_total: genresRows[0]?.distinct_genres ?? 0,
    episodes_rated_total: ratedEpisodeLogs,
    unique_episodes_watched_total: uniqueEpisodes.length,
  };
}

export async function recomputeAchievementProgressForUser(userId: string) {
  await syncAchievementCatalog();

  const [achievements, currentProgress, metrics] = await Promise.all([
    prisma.achievement.findMany({
      where: {
        active: true,
      },
      include: {
        tiers: {
          orderBy: {
            requiredCount: "asc",
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.userAchievementProgress.findMany({
      where: {
        userId,
      },
      select: {
        achievementId: true,
        highestTierLevel: true,
        unlockedAt: true,
      },
    }),
    buildMetricsForUser(userId),
  ]);

  const previousByAchievementId = new Map(
    currentProgress.map((row) => [row.achievementId, row]),
  );

  for (const achievement of achievements) {
    const metricValue = metrics[achievement.metricType] ?? 0;
    const tierProgress = resolveTierProgress(
      achievement.tiers.map((tier) => ({
        id: tier.id,
        level: tier.level,
        requiredCount: tier.requiredCount,
      })),
      metricValue,
    );

    const previous = previousByAchievementId.get(achievement.id);
    const highestTierLevel = Math.max(previous?.highestTierLevel ?? 0, tierProgress.currentTierLevel);
    const unlockedAt =
      previous?.unlockedAt ?? (tierProgress.currentTierLevel > 0 ? new Date() : null);

    await prisma.userAchievementProgress.upsert({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
      create: {
        userId,
        achievementId: achievement.id,
        currentTierId: tierProgress.currentTierId,
        currentCount: metricValue,
        progressPercent: tierProgress.progressPercent,
        highestTierLevel,
        unlockedAt,
      },
      update: {
        currentTierId: tierProgress.currentTierId,
        currentCount: metricValue,
        progressPercent: tierProgress.progressPercent,
        highestTierLevel,
        unlockedAt,
        updatedAt: new Date(),
      },
    });
  }
}

export async function safeRecomputeAchievementProgressForUser(userId: string) {
  try {
    await recomputeAchievementProgressForUser(userId);
  } catch (error) {
    if (!isAchievementTableMissingError(error)) {
      throw error;
    }
  }
}

export async function incrementWatchlistToWatchedProgress(userId: string, incrementBy = 1) {
  if (incrementBy <= 0) return;

  await syncAchievementCatalog();

  const achievement = await prisma.achievement.findUnique({
    where: {
      key: WATCHLIST_TO_WATCHED_KEY,
    },
    include: {
      tiers: {
        orderBy: {
          requiredCount: "asc",
        },
      },
    },
  });

  if (!achievement) return;

  const existing = await prisma.userAchievementProgress.findUnique({
    where: {
      userId_achievementId: {
        userId,
        achievementId: achievement.id,
      },
    },
  });

  const nextCount = (existing?.currentCount ?? 0) + incrementBy;
  const tierProgress = resolveTierProgress(
    achievement.tiers.map((tier) => ({
      id: tier.id,
      level: tier.level,
      requiredCount: tier.requiredCount,
    })),
    nextCount,
  );

  const highestTierLevel = Math.max(existing?.highestTierLevel ?? 0, tierProgress.currentTierLevel);
  const unlockedAt = existing?.unlockedAt ?? (tierProgress.currentTierLevel > 0 ? new Date() : null);

  await prisma.userAchievementProgress.upsert({
    where: {
      userId_achievementId: {
        userId,
        achievementId: achievement.id,
      },
    },
    create: {
      userId,
      achievementId: achievement.id,
      currentTierId: tierProgress.currentTierId,
      currentCount: nextCount,
      progressPercent: tierProgress.progressPercent,
      highestTierLevel,
      unlockedAt,
    },
    update: {
      currentTierId: tierProgress.currentTierId,
      currentCount: nextCount,
      progressPercent: tierProgress.progressPercent,
      highestTierLevel,
      unlockedAt,
      updatedAt: new Date(),
    },
  });
}

export async function safeIncrementWatchlistToWatchedProgress(userId: string, incrementBy = 1) {
  try {
    await incrementWatchlistToWatchedProgress(userId, incrementBy);
  } catch (error) {
    if (!isAchievementTableMissingError(error)) {
      throw error;
    }
  }
}
