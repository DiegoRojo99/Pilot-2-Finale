import type { ShowStatus } from "@/types";
import { prisma } from "@/lib/core";
import { findNextUnwatchedEpisode, isEpisodeUnreleased } from "@/lib/episodes";
import { syncShowEpisodeCatalog } from "@/lib/episodes/catalog";

/**
 * Episode rows are created as bare records when a user logs an episode, so a show
 * started from the mobile app can end up with only the logged episodes in the DB.
 * Sync the full TMDB catalog when it is incomplete or a watched episode lacks an air date.
 */
async function ensureEpisodeCatalog(tmdbShowId: number) {
  try {
    const show = await prisma.show.findUnique({
      where: { tmdbId: tmdbShowId },
      select: { numberOfEpisodes: true },
    });
    const expected = show?.numberOfEpisodes ?? 0;

    const [known, watchedWithoutAirDate] = await Promise.all([
      prisma.episode.count({ where: { tmdbShowId } }),
      prisma.episode.count({
        where: { tmdbShowId, airDate: null, watchEntries: { some: {} } },
      }),
    ]);

    if (expected > 0 && known >= expected && watchedWithoutAirDate === 0) return;

    await syncShowEpisodeCatalog(tmdbShowId, { force: watchedWithoutAirDate > 0 });
  } catch (error) {
    console.error("[shows/status] episode catalog sync failed", { tmdbShowId, error });
  }
}

type ProgressSnapshot = {
  totalEpisodes: number;
  watchedEpisodesCount: number;
};

export async function refreshUserShowProgress(userId: string, tmdbShowId: number) {
  const userShow = await prisma.userShow.findUnique({
    where: {
      userId_tmdbId: {
        userId,
        tmdbId: tmdbShowId,
      },
    },
    select: {
      show: {
        select: {
          numberOfEpisodes: true,
          totalRuntimeMinutes: true,
        },
      },
    },
  });

  if (!userShow) return;

  const watchedEntries = await prisma.watchEntry.findMany({
    where: {
      userId,
      episode: {
        tmdbShowId,
      },
    },
    distinct: ["episodeId"],
    select: {
      episode: {
        select: {
          runtime: true,
        },
      },
    },
  });

  const watchedEpisodesCount = watchedEntries.length;
  const watchedRuntimeMinutes = watchedEntries.reduce((sum, row) => sum + (row.episode.runtime ?? 0), 0);
  const totalRuntimeMinutes = userShow.show.totalRuntimeMinutes ?? 0;
  
  // Get count of released episodes only
  const allEpisodes = await prisma.episode.findMany({
    where: {
      tmdbShowId,
    },
    select: {
      airDate: true,
    },
  });
  
  const releasedEpisodesCount = allEpisodes.filter(
    (ep) => !isEpisodeUnreleased({ air_date: ep.airDate } as any)
  ).length;
  
  const remainingEpisodes = Math.max(0, releasedEpisodesCount - watchedEpisodesCount);
  const remainingRuntime = Math.max(0, totalRuntimeMinutes - watchedRuntimeMinutes);

  await prisma.userShow.updateMany({
    where: {
      userId,
      tmdbId: tmdbShowId,
    },
    data: {
      watchedEpisodesCount,
      watchedRuntimeMinutes,
      remainingEpisodesCount: remainingEpisodes,
      remainingRuntimeMinutes: remainingRuntime,
      updatedAt: new Date(),
    },
  });

  return {
    totalEpisodes: releasedEpisodesCount,
    watchedEpisodesCount,
  } satisfies ProgressSnapshot;
}

export async function refreshAllUsersShowProgress(tmdbShowId: number) {
  const userShows = await prisma.userShow.findMany({
    where: {
      tmdbId: tmdbShowId,
    },
    select: {
      userId: true,
    },
    distinct: ["userId"],
  });

  for (const userShow of userShows) {
    await refreshUserShowProgress(userShow.userId, tmdbShowId);
  }
}

export async function reconcileUserShowStatus(userId: string, tmdbShowId: number) {
  const progress = await refreshUserShowProgress(userId, tmdbShowId);

  const row = await prisma.userShow.findUnique({
    where: {
      userId_tmdbId: {
        userId,
        tmdbId: tmdbShowId,
      },
    },
    select: {
      status: true,
      watchedEpisodesCount: true,
      show: {
        select: {
          numberOfEpisodes: true,
        },
      },
    },
  });

  if (!row) return;

  const totalEpisodes = progress?.totalEpisodes ?? (row.show.numberOfEpisodes ?? 0);
  const watchedUniqueCount = progress?.watchedEpisodesCount ?? row.watchedEpisodesCount;
  const isComplete = totalEpisodes > 0 && watchedUniqueCount >= totalEpisodes;
  const markedAsWatched = row.status === "watched";

  if (isComplete && !markedAsWatched) {
    await prisma.userShow.updateMany({
      where: {
        userId,
        tmdbId: tmdbShowId,
      },
      data: {
        status: "watched",
        updatedAt: new Date(),
      },
    });
    return;
  }

  if (!isComplete && markedAsWatched) {
    await prisma.userShow.updateMany({
      where: {
        userId,
        tmdbId: tmdbShowId,
      },
      data: {
        status: "watching" satisfies ShowStatus,
        updatedAt: new Date(),
      },
    });
  }
}

/**
 * Updates the nextEpisodeToWatchId for a user show
 * Finds the first unwatched episode and stores its ID for quick retrieval
 */
export async function updateNextEpisodeToWatch(userId: string, tmdbShowId: number) {
  await ensureEpisodeCatalog(tmdbShowId);
  const nextEpisodeId = await findNextUnwatchedEpisode(userId, tmdbShowId);
  await prisma.userShow.updateMany({
    where: {
      userId,
      tmdbId: tmdbShowId,
    },
    data: {
      nextEpisodeToWatchId: nextEpisodeId,
      updatedAt: new Date(),
    },
  });
}
