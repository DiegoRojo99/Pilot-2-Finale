import type { ShowStatus } from "@/types";
import { prisma } from "@/lib/core";
import { findNextUnwatchedEpisode } from "@/lib/episodes";

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
  const totalEpisodes = userShow.show.numberOfEpisodes ?? 0;
  const totalRuntimeMinutes = userShow.show.totalRuntimeMinutes ?? 0;
  const remainingEpisodes = Math.max(0, totalEpisodes - watchedEpisodesCount);
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
    totalEpisodes,
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
