import { prisma } from "@/lib/core";
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
    const showLogs = logsByShowId[showId] ?? [];
    
    // Count watched episodes from both cache and logs
    const watchedUniqueCount = showEpisodes.reduce(
      (count, episode) => count + (watchedEpisodeIds.has(episode.id) ? 1 : 0),
      0,
    );

    // Find next episode from cached episodes first
    let nextEpisode = showEpisodes.find((episode) => !watchedEpisodeIds.has(episode.id)) ?? null;

    // Debug: log if this is Slow Horses (TMDB ID 65937) or any show with watched episodes but no next
    if ((showId === 65937 || (watchedUniqueCount > 0 && !nextEpisode && showLogs.length > 0))) {
      console.log(`[episode-batch] Show ${showId}: cached episodes: ${showEpisodes.length}, logs: ${showLogs.length}, watched count: ${watchedUniqueCount}`);
    }

    // If no next episode found in cache, try to infer from logs
    if (!nextEpisode && showLogs.length > 0) {
      // Find the highest watched episode from logs
      const watchedLogs = showLogs.filter((log) => log.watched_at !== null);
      
      if (watchedLogs.length > 0) {
        const highestWatched = watchedLogs.reduce((highest, current) => {
          if (current.season_number > highest.season_number) return current;
          if (current.season_number === highest.season_number && current.episode_number > highest.episode_number)
            return current;
          return highest;
        });

        if (showId === 65937) {
          console.log(`[episode-batch] Slow Horses: highest watched from logs: S${highestWatched.season_number}E${highestWatched.episode_number}, looking for next...`);
          console.log(`[episode-batch] Slow Horses: cached episodes available:`, showEpisodes.length);
        }

        // Try to find next episode from cache (episodes table)
        if (showEpisodes.length > 0) {
          nextEpisode = showEpisodes.find(
            (ep) =>
              ep.seasonNumber > highestWatched.season_number ||
              (ep.seasonNumber === highestWatched.season_number && ep.episodeNumber > highestWatched.episode_number),
          ) ?? null;
          
          if (showId === 65937) {
            console.log(`[episode-batch] Slow Horses: found next in cache:`, nextEpisode ? `S${nextEpisode.seasonNumber}E${nextEpisode.episodeNumber}` : 'null');
          }
        }

        // If still not found, construct from the next logical episode
        if (!nextEpisode) {
          const nextInSequence = showLogs.find(
            (log) =>
              log.season_number > highestWatched.season_number ||
              (log.season_number === highestWatched.season_number && log.episode_number > highestWatched.episode_number),
          );

          if (showId === 65937) {
            console.log(`[episode-batch] Slow Horses: found next in logs:`, nextInSequence ? `S${nextInSequence.season_number}E${nextInSequence.episode_number}` : 'null');
          }

          if (nextInSequence) {
            nextEpisode = {
              id: 0,
              tmdbShowId: showId,
              tmdbEpisodeId: nextInSequence.tmdb_episode_id ?? null,
              seasonNumber: nextInSequence.season_number,
              episodeNumber: nextInSequence.episode_number,
              name: nextInSequence.episode_name,
            };
          } 
          else {
            // Final fallback: suggest the next episode in sequence (not in cache or logs)
            // This handles shows where later episodes haven't been synced to the database yet
            nextEpisode = {
              id: 0,
              tmdbShowId: showId,
              tmdbEpisodeId: null,
              seasonNumber: highestWatched.season_number,
              episodeNumber: highestWatched.episode_number + 1,
              name: null,
            };
          }
        }
      } else if (showLogs.length > 0 && showEpisodes.length === 0) {
        // No cached episodes and no watched logs, suggest first episode from logs
        const firstInLogs = showLogs[0];
        if (firstInLogs) {
          nextEpisode = {
            id: 0,
            tmdbShowId: showId,
            tmdbEpisodeId: firstInLogs.tmdb_episode_id ?? null,
            seasonNumber: firstInLogs.season_number,
            episodeNumber: firstInLogs.episode_number,
            name: firstInLogs.episode_name,
          };
        }
      }
    } else if (!nextEpisode && watchedUniqueCount > 0) {
      // Alternative: if we have cached episodes with watches but no next episode found
      // and no logs to fall back to, we should still try to suggest the next episode
      // Find the highest watched episode from the cache
      const watchedEpisodes = showEpisodes.filter((ep) => watchedEpisodeIds.has(ep.id));
      if (watchedEpisodes.length > 0) {
        const highestWatched = watchedEpisodes.reduce((highest, current) => {
          if (current.seasonNumber > highest.seasonNumber) return current;
          if (current.seasonNumber === highest.seasonNumber && current.episodeNumber > highest.episodeNumber)
            return current;
          return highest;
        });

        // Suggest the next episode in sequence
        nextEpisode = {
          id: 0,
          tmdbShowId: showId,
          tmdbEpisodeId: null,
          seasonNumber: highestWatched.seasonNumber,
          episodeNumber: highestWatched.episodeNumber + 1,
          name: null,
        };
      }
    }

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