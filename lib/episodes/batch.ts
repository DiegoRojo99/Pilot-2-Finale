import { prisma } from "@/lib/core";
import type { EpisodeBatchResponse, EpisodeLog, ShowNextEpisode, ShowProgress } from "@/types";

type EpisodeRow = { id: number; tmdbShowId: number; tmdbEpisodeId: number | null; seasonNumber: number; episodeNumber: number; name: string | null };
type NextEpisodeCandidate = { id: number; tmdbShowId: number; tmdbEpisodeId: number | null; seasonNumber: number; episodeNumber: number; name: string | null };

type RawLog = {
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
};

function mapEpisodeLog(row: RawLog): EpisodeLog {
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

function deduplicateAndGroupLogs(rawLogs: RawLog[]): Record<number, EpisodeLog[]> {
  const latestByShowEpisode = new Map<string, RawLog>();
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

  return logsByShowId;
}

function groupEpisodesByShow(episodes: EpisodeRow[]): Map<number, EpisodeRow[]> {
  const episodesByShowId = new Map<number, EpisodeRow[]>();
  for (const episode of episodes) {
    const bucket = episodesByShowId.get(episode.tmdbShowId) ?? [];
    bucket.push(episode);
    episodesByShowId.set(episode.tmdbShowId, bucket);
  }
  return episodesByShowId;
}

function findHighestWatchedEpisode(logs: EpisodeLog[]): EpisodeLog | null {
  const watchedLogs = logs.filter((log) => log.watched_at !== null);
  if (watchedLogs.length === 0) return null;

  return watchedLogs.reduce((highest, current) => {
    if (current.season_number > highest.season_number) return current;
    if (current.season_number === highest.season_number && current.episode_number > highest.episode_number)
      return current;
    return highest;
  });
}

function findNextEpisodeInCache(showEpisodes: EpisodeRow[], watchedEpisodeIds: Set<number>): EpisodeRow | null {
  return showEpisodes.find((episode) => !watchedEpisodeIds.has(episode.id)) ?? null;
}

function findNextEpisodeFromLogs(
  showId: number,
  highestWatched: EpisodeLog,
  showEpisodes: EpisodeRow[],
  showLogs: EpisodeLog[],
): NextEpisodeCandidate | null {
  // Try to find next episode from cache (episodes table)
  if (showEpisodes.length > 0) {
    const nextInCache = showEpisodes.find(
      (ep) =>
        ep.seasonNumber > highestWatched.season_number ||
        (ep.seasonNumber === highestWatched.season_number && ep.episodeNumber > highestWatched.episode_number),
    );

    if (nextInCache) return nextInCache;
  }

  // Try to find next episode from logs
  const nextInSequence = showLogs.find(
    (log) =>
      log.season_number > highestWatched.season_number ||
      (log.season_number === highestWatched.season_number && log.episode_number > highestWatched.episode_number),
  );

  if (nextInSequence) {
    return {
      id: 0,
      tmdbShowId: showId,
      tmdbEpisodeId: nextInSequence.tmdb_episode_id ?? null,
      seasonNumber: nextInSequence.season_number,
      episodeNumber: nextInSequence.episode_number,
      name: nextInSequence.episode_name,
    };
  }

  // Final fallback: suggest the next episode in sequence
  // This handles shows where later episodes haven't been synced to the database yet
  return {
    id: 0,
    tmdbShowId: showId,
    tmdbEpisodeId: null,
    seasonNumber: highestWatched.season_number,
    episodeNumber: highestWatched.episode_number + 1,
    name: null,
  };
}

function formatEpisodeRowAsNext(episode: EpisodeRow | NextEpisodeCandidate): ShowNextEpisode {
  return {
    tmdb_episode_id: episode.tmdbEpisodeId,
    season_number: episode.seasonNumber,
    episode_number: episode.episodeNumber,
    episode_name: episode.name,
    has_reliable_next: true,
  };
}

function formatEpisodeLogAsNext(episode: EpisodeLog): ShowNextEpisode {
  return {
    tmdb_episode_id: episode.tmdb_episode_id ?? null,
    season_number: episode.season_number,
    episode_number: episode.episode_number,
    episode_name: episode.episode_name,
    has_reliable_next: true,
  };
}

function findHighestWatchedFromCache(
  showEpisodes: EpisodeRow[],
  watchedEpisodeIds: Set<number>,
): EpisodeRow | null {
  const watchedEpisodes = showEpisodes.filter((ep) => watchedEpisodeIds.has(ep.id));
  if (watchedEpisodes.length === 0) return null;

  return watchedEpisodes.reduce((highest, current) => {
    if (current.seasonNumber > highest.seasonNumber) return current;
    if (current.seasonNumber === highest.seasonNumber && current.episodeNumber > highest.episodeNumber)
      return current;
    return highest;
  });
}

function tryFindNextFromCache(
  showEpisodes: EpisodeRow[],
  watchedEpisodeIds: Set<number>,
): ShowNextEpisode | null {
  const nextEpisode = findNextEpisodeInCache(showEpisodes, watchedEpisodeIds);
  return nextEpisode ? formatEpisodeRowAsNext(nextEpisode) : null;
}

function tryFindNextFromLogs(
  showId: number,
  showEpisodes: EpisodeRow[],
  showLogs: EpisodeLog[],
): ShowNextEpisode | null {
  const highestWatched = findHighestWatchedEpisode(showLogs);
  if (!highestWatched) return null;

  const nextEpisode = findNextEpisodeFromLogs(showId, highestWatched, showEpisodes, showLogs);
  return nextEpisode ? formatEpisodeRowAsNext(nextEpisode) : null;
}

function tryFindFirstFromLogs(
  showLogs: EpisodeLog[],
  showEpisodes: EpisodeRow[],
): ShowNextEpisode | null {
  if (showEpisodes.length > 0) return null;
  if (showLogs.some((log) => log.watched_at !== null)) return null;

  const firstInLogs = showLogs[0];
  if (!firstInLogs) return null;

  return formatEpisodeLogAsNext(firstInLogs);
}

function tryFindNextFromCache_AlternativeMethod(
  showId: number,
  showEpisodes: EpisodeRow[],
  watchedEpisodeIds: Set<number>,
  watchedCount: number,
): ShowNextEpisode | null {
  if (watchedCount === 0) return null;

  const highestWatchedInCache = findHighestWatchedFromCache(showEpisodes, watchedEpisodeIds);
  if (!highestWatchedInCache) return null;

  const nextEpisode: NextEpisodeCandidate = {
    id: 0,
    tmdbShowId: showId,
    tmdbEpisodeId: null,
    seasonNumber: highestWatchedInCache.seasonNumber,
    episodeNumber: highestWatchedInCache.episodeNumber + 1,
    name: null,
  };

  return formatEpisodeRowAsNext(nextEpisode);
}

function calculateShowProgress(
  showId: number,
  numberOfEpisodes: number,
  showEpisodes: EpisodeRow[],
  showLogs: EpisodeLog[],
  watchedEpisodeIds: Set<number>,
): ShowProgress {
  const showProgress: ShowProgress = {
    tmdb_show_id: showId,
    watched_unique_count: showEpisodes.reduce(
      (count, episode) => count + (watchedEpisodeIds.has(episode.id) ? 1 : 0),
      0,
    ),
    number_of_episodes: numberOfEpisodes ?? 0,
    next_episode: null,
  };

  // Try to find next episode - stops at first successful match
  showProgress.next_episode =
    tryFindNextFromCache(showEpisodes, watchedEpisodeIds) ??
    tryFindNextFromLogs(showId, showEpisodes, showLogs) ??
    tryFindFirstFromLogs(showLogs, showEpisodes) ??
    tryFindNextFromCache_AlternativeMethod(showId, showEpisodes, watchedEpisodeIds, showProgress.watched_unique_count) ??
    null;

  return showProgress;
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

  const logsByShowId = deduplicateAndGroupLogs(rawLogs);

  // Build watched episodes set directly from rawLogs instead of separate query
  const watchedEpisodeIds = new Set<number>();
  for (const log of rawLogs) {
    if (log.watchedAt !== null) watchedEpisodeIds.add(log.episodeId);
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

  const episodes = await prisma.episode.findMany({
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
  });

  const episodesByShowId = groupEpisodesByShow(episodes);
  const progressByShowId: Record<number, ShowProgress> = {};

  for (const userShow of userShows) {
    const showId = userShow.tmdbId;
    const showEpisodes = episodesByShowId.get(showId) ?? [];
    const showLogs = logsByShowId[showId] ?? [];

    progressByShowId[showId] = calculateShowProgress(
      showId,
      userShow.show.numberOfEpisodes ?? 0,
      showEpisodes,
      showLogs,
      watchedEpisodeIds,
    );
  }

  return {
    logsByShowId,
    progressByShowId,
  };
}