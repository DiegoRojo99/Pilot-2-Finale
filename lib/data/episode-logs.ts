import { prisma } from "@/lib/prisma";
import type { EpisodeLog } from "@/types";

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

export async function fetchLatestEpisodeLogsForShow(userId: string, tmdbShowId: number): Promise<EpisodeLog[]> {
  const rows = await prisma.watchEntry.findMany({
    where: {
      userId,
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

  return Array.from(latestByEpisodeId.values())
    .sort((a, b) => {
      if (a.episode.seasonNumber !== b.episode.seasonNumber) {
        return a.episode.seasonNumber - b.episode.seasonNumber;
      }

      return a.episode.episodeNumber - b.episode.episodeNumber;
    })
    .map(mapEpisodeLog);
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