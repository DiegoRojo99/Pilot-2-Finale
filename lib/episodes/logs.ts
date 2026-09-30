import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/core";
import type { EpisodeLog } from "@/types";
import { isEpisodeUnreleased } from "./unreleased";

function mapEpisodeLog(row: {
  id: number;
  episodeId: number;
  watchedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  rating: number | null;
  notes: string | null;
  episode: {
    tmdbEpisodeId: number | null;
    tmdbShowId: number;
    seasonNumber: number;
    episodeNumber: number;
    name: string | null;
  };
}): EpisodeLog {
  return {
    id: row.id,
    episode_id: row.episodeId,
    tmdb_episode_id: row.episode.tmdbEpisodeId,
    tmdb_show_id: row.episode.tmdbShowId,
    season_number: row.episode.seasonNumber,
    episode_number: row.episode.episodeNumber,
    episode_name: row.episode.name,
    watched_at: row.watchedAt ? row.watchedAt.toISOString() : null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    rating: row.rating,
    notes: row.notes,
  };
}

const EPISODE_LOG_SELECT = {
  id: true,
  episodeId: true,
  watchedAt: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  notes: true,
  episode: {
    select: {
      tmdbEpisodeId: true,
      tmdbShowId: true,
      seasonNumber: true,
      episodeNumber: true,
      name: true,
    },
  },
} as const;

const EPISODE_LOG_WITH_SHOW_SELECT = {
  id: true,
  episodeId: true,
  watchedAt: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  notes: true,
  episode: {
    select: {
      tmdbEpisodeId: true,
      tmdbShowId: true,
      seasonNumber: true,
      episodeNumber: true,
      name: true,
      stillPath: true,
      show: {
        select: {
          name: true,
          posterPath: true,
        },
      },
    },
  },
} as const;

function mapEpisodeLogWithShow(row: {
  id: number;
  episodeId: number;
  watchedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  rating: number | null;
  notes: string | null;
  episode: {
    tmdbEpisodeId: number | null;
    tmdbShowId: number;
    seasonNumber: number;
    episodeNumber: number;
    name: string | null;
    stillPath: string | null;
    show: {
      name: string;
      posterPath: string | null;
    };
  };
}): EpisodeLog {
  return {
    ...mapEpisodeLog(row),
    still_path: row.episode.stillPath,
    show_name: row.episode.show.name,
    poster_path: row.episode.show.posterPath,
  };
}

type EpisodeListOptions = {
  withWatchDate?: boolean;
  limit?: number;
  offset?: number;
};

type EpisodeUpsertInput = {
  tmdbShowId: number;
  tmdbEpisodeId?: number | null;
  seasonNumber: number;
  episodeNumber: number;
  episodeName?: string | null;
};

type EpisodeLogCreateInput = {
  tmdbShowId: number;
  tmdbEpisodeId?: number | null;
  seasonNumber: number;
  episodeNumber: number;
  episodeName?: string | null;
  rating: number | null;
  notes?: string | null;
  watchedAt?: string | null;
};

type EpisodeLogBulkCreateInput = {
  tmdbEpisodeId?: number | null;
  seasonNumber: number;
  episodeNumber: number;
  episodeName?: string | null;
  rating: number | null;
  notes?: string | null;
  watchedAt?: string | null;
};

function parseWatchedAt(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid watched_at timestamp");
  }

  return parsed;
}

async function ensureEpisodeRecord(
  tx: Prisma.TransactionClient,
  input: EpisodeUpsertInput,
): Promise<number> {
  const uniqueWhere = {
    tmdbShowId_seasonNumber_episodeNumber: {
      tmdbShowId: input.tmdbShowId,
      seasonNumber: input.seasonNumber,
      episodeNumber: input.episodeNumber,
    },
  };

  const existing = await tx.episode.findUnique({
    where: uniqueWhere,
    select: {
      id: true,
      tmdbEpisodeId: true,
      name: true,
    },
  });

  if (!existing) {
    const created = await tx.episode.create({
      data: {
        tmdbShowId: input.tmdbShowId,
        tmdbEpisodeId: input.tmdbEpisodeId ?? null,
        seasonNumber: input.seasonNumber,
        episodeNumber: input.episodeNumber,
        name: input.episodeName ?? null,
      },
      select: {
        id: true,
      },
    });

    return created.id;
  }

  const updated = await tx.episode.update({
    where: {
      id: existing.id,
    },
    data: {
      tmdbEpisodeId: input.tmdbEpisodeId ?? existing.tmdbEpisodeId,
      name: input.episodeName ?? existing.name,
    },
    select: {
      id: true,
    },
  });

  return updated.id;
}

export async function fetchLatestEpisodeLogsForShow(
  userId: string,
  tmdbShowId: number,
  options?: EpisodeListOptions,
): Promise<EpisodeLog[]> {
  const withWatchDate = options?.withWatchDate ?? false;
  const limit = options?.limit;
  const offset = options?.offset ?? 0;

  const rows = await prisma.watchEntry.findMany({
    where: {
      userId,
      ...(withWatchDate ? { watchedAt: { not: null } } : {}),
      episode: {
        tmdbShowId,
      },
    },
    select: EPISODE_LOG_SELECT,
    orderBy: [
      { episodeId: "asc" },
      { watchedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
      { id: "desc" },
    ],
  });

  const latestByEpisodeId = new Map<number, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latestByEpisodeId.has(row.episodeId)) {
      latestByEpisodeId.set(row.episodeId, row);
    }
  }

  const latestLogs = Array.from(latestByEpisodeId.values())
    .sort((a, b) => {
      if (a.episode.seasonNumber !== b.episode.seasonNumber) {
        return a.episode.seasonNumber - b.episode.seasonNumber;
      }

      return a.episode.episodeNumber - b.episode.episodeNumber;
    })
    .map(mapEpisodeLog);

  const start = Math.max(offset, 0);
  if (typeof limit === "number") {
    return latestLogs.slice(start, start + Math.max(limit, 0));
  }

  return latestLogs.slice(start);
}

export async function fetchEpisodeLogsForUser(userId: string, options?: EpisodeListOptions): Promise<EpisodeLog[]> {
  const withWatchDate = options?.withWatchDate ?? false;
  const limit = Math.max(options?.limit ?? 50, 0);
  const offset = Math.max(options?.offset ?? 0, 0);

  const rows = await prisma.watchEntry.findMany({
    where: {
      userId,
      ...(withWatchDate ? { watchedAt: { not: null } } : {}),
    },
    select: EPISODE_LOG_WITH_SHOW_SELECT,
    orderBy: [
      { watchedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
      { id: "desc" },
    ],
    take: limit,
    skip: offset,
  });
  
  const episodeLogsWithShow = rows.map(mapEpisodeLogWithShow);
  console.log(episodeLogsWithShow);
  return episodeLogsWithShow;
}

export async function userHasShowInList(userId: string, tmdbShowId: number): Promise<boolean> {
  const count = await prisma.userShow.count({
    where: {
      userId,
      tmdbId: tmdbShowId,
    },
  });

  return count > 0;
}

export async function createEpisodeLogForUser(userId: string, input: EpisodeLogCreateInput): Promise<EpisodeLog> {
  return prisma.$transaction(async (tx) => {
    const episodeId = await ensureEpisodeRecord(tx, {
      tmdbShowId: input.tmdbShowId,
      tmdbEpisodeId: input.tmdbEpisodeId,
      seasonNumber: input.seasonNumber,
      episodeNumber: input.episodeNumber,
      episodeName: input.episodeName,
    });

    const created = await tx.watchEntry.create({
      data: {
        userId,
        episodeId,
        rating: input.rating,
        notes: input.notes ?? null,
        watchedAt: parseWatchedAt(input.watchedAt),
      },
      select: EPISODE_LOG_WITH_SHOW_SELECT,
    });

    return mapEpisodeLogWithShow(created);
  });
}

export async function createEpisodeLogsBulkForUser(
  userId: string,
  tmdbShowId: number,
  episodes: EpisodeLogBulkCreateInput[],
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const entries: Array<{
      userId: string;
      episodeId: number;
      rating: number | null;
      notes: string | null;
      watchedAt: Date | null;
    }> = [];

    for (const episode of episodes) {
      const episodeId = await ensureEpisodeRecord(tx, {
        tmdbShowId,
        tmdbEpisodeId: episode.tmdbEpisodeId,
        seasonNumber: episode.seasonNumber,
        episodeNumber: episode.episodeNumber,
        episodeName: episode.episodeName,
      });

      entries.push({
        userId,
        episodeId,
        rating: episode.rating,
        notes: episode.notes ?? null,
        watchedAt: parseWatchedAt(episode.watchedAt),
      });
    }

    if (entries.length === 0) return 0;
    const inserted = await tx.watchEntry.createMany({
      data: entries,
    });

    return inserted.count;
  });
}

export async function fetchEpisodeLogsForShowSeasonEpisode(
  userId: string,
  tmdbShowId: number,
  season: number,
  episode: number,
): Promise<EpisodeLog[]> {
  const rows = await prisma.watchEntry.findMany({
    where: {
      userId,
      episode: {
        tmdbShowId,
        seasonNumber: season,
        episodeNumber: episode,
      },
    },
    select: EPISODE_LOG_SELECT,
    orderBy: [
      { watchedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
      { id: "desc" },
    ],
  });

  return rows.map(mapEpisodeLog);
}

export async function deleteEpisodeLogById(userId: string, logId: number): Promise<number | null> {
  const existing = await prisma.watchEntry.findFirst({
    where: {
      id: logId,
      userId,
    },
    select: {
      id: true,
      episode: {
        select: {
          tmdbShowId: true,
        },
      },
    },
  });

  if (!existing) return null;

  await prisma.watchEntry.delete({
    where: {
      id: existing.id,
    },
  });

  return existing.episode.tmdbShowId;
}

type EpisodeLogUpdateInput = {
  watchedAt?: string | null;
  rating?: number | null;
  notes?: string | null;
};

export async function updateEpisodeLogById(
  userId: string,
  logId: number,
  input: EpisodeLogUpdateInput,
): Promise<EpisodeLog | null> {
  const existing = await prisma.watchEntry.findFirst({
    where: {
      id: logId,
      userId,
    },
    select: {
      id: true,
      episode: {
        select: {
          tmdbShowId: true,
        },
      },
    },
  });

  if (!existing) return null;

  const updated = await prisma.watchEntry.update({
    where: {
      id: existing.id,
    },
    data: {
      watchedAt: input.watchedAt === undefined ? undefined : parseWatchedAt(input.watchedAt),
      rating: input.rating === undefined ? undefined : input.rating,
      notes: input.notes === undefined ? undefined : input.notes,
    },
    select: EPISODE_LOG_WITH_SHOW_SELECT,
  });

  return mapEpisodeLogWithShow(updated);
}

export async function deleteEpisodeLogsForShowSeasonEpisode(
  userId: string,
  tmdbShowId: number,
  season: number,
  episode: number,
): Promise<number> {
  const deleted = await prisma.watchEntry.deleteMany({
    where: {
      userId,
      episode: {
        tmdbShowId,
        seasonNumber: season,
        episodeNumber: episode,
      },
    },
  });

  return deleted.count;
}

/**
 * Find the next unwatched episode for a user in a show
 * Returns the episode ID of the first unwatched episode in chronological order,
 * or null if all episodes are watched or no episodes exist
 */
export async function findNextUnwatchedEpisode(
  userId: string,
  tmdbShowId: number,
): Promise<number | null> {
  // Get all watched episode IDs for this user in this show
  const watchedEntries = await prisma.watchEntry.findMany({
    where: {
      userId,
      episode: {
        tmdbShowId,
      },
    },
    select: {
      episodeId: true,
    },
  });

  const watchedEpisodeIds = new Set(watchedEntries.map((e) => e.episodeId));

  // Get all episodes for this show, ordered chronologically, with airDate to check if released
  const episodes = await prisma.episode.findMany({
    where: {
      tmdbShowId,
    },
    select: {
      id: true,
      seasonNumber: true,
      episodeNumber: true,
      airDate: true,
    },
    orderBy: [
      { seasonNumber: "asc" },
      { episodeNumber: "asc" },
    ],
  });

  // Find the first unwatched RELEASED episode
  for (const episode of episodes) {
    if (!watchedEpisodeIds.has(episode.id)) {
      // Only return if episode is released
      if (!isEpisodeUnreleased({ air_date: episode.airDate } as any)) {
        return episode.id;
      }
    }
  }

  // All released episodes are watched
  return null;
}