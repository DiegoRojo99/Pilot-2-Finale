import { prisma } from "@/lib/prisma";
import type { EpisodeBatchResponse, EpisodeLog, ShowProgress } from "@/types";

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

export async function fetchEpisodeBatchForUser(userId: string, tmdbShowIds: number[]): Promise<EpisodeBatchResponse> {
  if (tmdbShowIds.length === 0) {
    return {
      logsByShowId: {},
      progressByShowId: {},
    };
  }

  const rawLogs = await prisma.watchEntry.findMany({
    where: {
      userId,
      episode: {
        tmdbShowId: {
          in: tmdbShowIds,
        },
      },
    },
    select: {
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
    },
    orderBy: [
      { episode: { tmdbShowId: "asc" } },
      { episodeId: "asc" },
      { watchedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
      { id: "desc" },
    ],
  });

  const latestByShowEpisode = new Map<string, typeof rawLogs[number]>();
  for (const row of rawLogs) {
    const key = `${row.episode.tmdbShowId}:${row.episodeId}`;
    if (!latestByShowEpisode.has(key)) {
      latestByShowEpisode.set(key, row);
    }
  }

  const latestLogs = Array.from(latestByShowEpisode.values()).sort((a, b) => {
    if (a.episode.tmdbShowId !== b.episode.tmdbShowId) return a.episode.tmdbShowId - b.episode.tmdbShowId;
    if (a.episode.seasonNumber !== b.episode.seasonNumber) return a.episode.seasonNumber - b.episode.seasonNumber;
    return a.episode.episodeNumber - b.episode.episodeNumber;
  });

  const logsByShowId: Record<number, EpisodeLog[]> = {};
  for (const log of latestLogs) {
    const mapped = mapEpisodeLog(log);
    const bucket = logsByShowId[mapped.tmdb_show_id] ?? [];
    bucket.push(mapped);
    logsByShowId[mapped.tmdb_show_id] = bucket;
  }

  const userShows = await prisma.userShow.findMany({
    where: {
      userId,
      tmdbId: {
        in: tmdbShowIds,
      },
    },
    select: {
      tmdbId: true,
      show: {
        select: {
          numberOfEpisodes: true,
        },
      },
    },
  });

  const scopedShowIds = userShows.map((show) => show.tmdbId);
  if (scopedShowIds.length === 0) {
    return {
      logsByShowId,
      progressByShowId: {},
    };
  }

  const [episodes, watchedEntries] = await Promise.all([
    prisma.episode.findMany({
      where: {
        tmdbShowId: {
          in: scopedShowIds,
        },
      },
      select: {
        id: true,
        tmdbShowId: true,
        tmdbEpisodeId: true,
        seasonNumber: true,
        episodeNumber: true,
        name: true,
      },
      orderBy: [
        { tmdbShowId: "asc" },
        { seasonNumber: "asc" },
        { episodeNumber: "asc" },
      ],
    }),
    prisma.watchEntry.findMany({
      where: {
        userId,
        episode: {
          tmdbShowId: {
            in: scopedShowIds,
          },
        },
      },
      select: {
        episodeId: true,
      },
      distinct: ["episodeId"],
    }),
  ]);

  const watchedEpisodeIds = new Set(watchedEntries.map((entry) => entry.episodeId));
  const episodesByShowId = new Map<number, typeof episodes>();

  for (const episode of episodes) {
    const bucket = episodesByShowId.get(episode.tmdbShowId) ?? [];
    bucket.push(episode);
    episodesByShowId.set(episode.tmdbShowId, bucket);
  }

  const progressByShowId: Record<number, ShowProgress> = {};

  for (const userShow of userShows) {
    const showId = userShow.tmdbId;
    const showEpisodes = episodesByShowId.get(showId) ?? [];
    const watchedUniqueCount = showEpisodes.reduce(
      (count, episode) => count + (watchedEpisodeIds.has(episode.id) ? 1 : 0),
      0,
    );

    const nextEpisode = showEpisodes.find((episode) => !watchedEpisodeIds.has(episode.id)) ?? null;

    progressByShowId[showId] = {
      tmdb_show_id: showId,
      watched_unique_count: watchedUniqueCount,
      number_of_episodes: userShow.show.numberOfEpisodes ?? 0,
      next_episode: nextEpisode
        ? {
            tmdb_episode_id: nextEpisode.tmdbEpisodeId,
            season_number: nextEpisode.seasonNumber,
            episode_number: nextEpisode.episodeNumber,
            episode_name: nextEpisode.name,
            has_reliable_next: true,
          }
        : null,
    };
  }

  return {
    logsByShowId,
    progressByShowId,
  };
}