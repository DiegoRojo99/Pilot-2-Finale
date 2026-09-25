import { prisma } from "@/lib/core";
import type { EpisodeStatsPeriod, EpisodeStatsResponse } from "@/types";

const PERIOD_TO_DAYS: Record<EpisodeStatsPeriod, number> = {
  l7d: 7,
  l30d: 30,
  ly: 365,
};

export function parseEpisodeStatsPeriod(value: string | null): EpisodeStatsPeriod {
  if (value === "l7d" || value === "l30d" || value === "ly") return value;
  return "l30d";
}

function getPeriodStart(period: EpisodeStatsPeriod): Date {
  const days = PERIOD_TO_DAYS[period];
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function fetchEpisodeStats(userId: string, period: EpisodeStatsPeriod): Promise<EpisodeStatsResponse> {
  const periodStart = getPeriodStart(period);

  const [
    totalEpisodes,
    totalShows,
    statusBuckets,
    watchingPending,
    entriesInPeriod,
  ] = await Promise.all([
    prisma.watchEntry.count({ where: { userId } }),
    prisma.userShow.count({ where: { userId } }),
    prisma.userShow.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.userShow.aggregate({
      where: { userId, status: "watching" },
      _sum: {
        remainingEpisodesCount: true,
        remainingRuntimeMinutes: true,
      },
    }),
    prisma.watchEntry.findMany({
      where: {
        userId,
        OR: [
          { watchedAt: { gte: periodStart } },
          {
            watchedAt: null,
            createdAt: { gte: periodStart },
          },
        ],
      },
      select: {
        episode: {
          select: {
            runtime: true,
          },
        },
      },
    }),
  ]);

  let watchingShows = 0;
  let watchedShows = 0;
  let wantToWatch = 0;

  for (const bucket of statusBuckets) {
    if (bucket.status === "watching") watchingShows = bucket._count._all;
    if (bucket.status === "watched") watchedShows = bucket._count._all;
    if (bucket.status === "want_to_watch") wantToWatch = bucket._count._all;
  }

  const timeSpentMinutes = entriesInPeriod.reduce((sum, entry) => sum + (entry.episode.runtime ?? 0), 0);

  return {
    period,
    totalEpisodes,
    totalShows,
    watchingShows,
    watchedShows,
    wantToWatch,
    timeSpentMinutes,
    pendingEpisodesWatching: watchingPending._sum.remainingEpisodesCount ?? 0,
    pendingRuntimeMinutesWatching: watchingPending._sum.remainingRuntimeMinutes ?? 0,
  };
}