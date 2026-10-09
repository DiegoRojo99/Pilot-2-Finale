import { prisma } from "@/lib/core";
import { upsertShowCatalog } from "@/lib/shows";
import { tmdbFetch } from "@/lib/tmdb";
import { refreshAllUsersShowProgress } from "@/lib/shows";

type CatalogSyncResult = {
  tmdbShowId: number;
  synced: boolean;
  reason: "up_to_date" | "incomplete" | "new_episodes" | "missing_expected_count";
  expectedEpisodes: number;
  knownEpisodes: number;
};

type TmdbShowSummary = {
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string | null;
  first_air_date?: string | null;
  vote_average?: number;
  number_of_episodes?: number;
  number_of_seasons?: number;
  episode_run_time?: number[];
  genres?: Array<{ id: number; name: string }>;
  seasons?: Array<{ season_number: number; episode_count?: number }>;
};

type TmdbSeasonPayload = {
  episodes?: Array<{
    id: number;
    season_number: number;
    episode_number: number;
    name: string;
    overview: string;
    air_date: string;
    still_path: string | null;
    vote_average: number;
    runtime: number | null;
  }>;
};

async function upsertSeasonEpisodes(tmdbShowId: number, seasonNumber: number) {
  const season = await tmdbFetch<TmdbSeasonPayload>(`/tv/${tmdbShowId}/season/${seasonNumber}`);

  const payload = (season.episodes ?? [])
    .filter((episode) => episode.episode_number > 0)
    .map((episode) => ({
      tmdb_episode_id: episode.id,
      tmdb_show_id: tmdbShowId,
      season_number: episode.season_number,
      episode_number: episode.episode_number,
      name: episode.name ?? null,
      overview: episode.overview ?? null,
      air_date: episode.air_date ?? null,
      still_path: episode.still_path ?? null,
      vote_average: Number.isFinite(episode.vote_average) ? episode.vote_average : 0,
      runtime: episode.runtime ?? null,
    }));

  if (payload.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const episode of payload) {
      const existing = await tx.episode.findUnique({
        where: {
          tmdbShowId_seasonNumber_episodeNumber: {
            tmdbShowId: episode.tmdb_show_id,
            seasonNumber: episode.season_number,
            episodeNumber: episode.episode_number,
          },
        },
      });

      if (!existing) {
        await tx.episode.create({
          data: {
            tmdbEpisodeId: episode.tmdb_episode_id,
            tmdbShowId: episode.tmdb_show_id,
            seasonNumber: episode.season_number,
            episodeNumber: episode.episode_number,
            name: episode.name,
            overview: episode.overview,
            airDate: episode.air_date,
            stillPath: episode.still_path,
            voteAverage: episode.vote_average,
            runtime: episode.runtime,
          },
        });

        continue;
      }

      await tx.episode.update({
        where: {
          id: existing.id,
        },
        data: {
          tmdbEpisodeId: episode.tmdb_episode_id ?? existing.tmdbEpisodeId,
          name: episode.name ?? existing.name,
          overview: episode.overview ?? existing.overview,
          airDate: episode.air_date ?? existing.airDate,
          stillPath: episode.still_path ?? existing.stillPath,
          voteAverage: episode.vote_average > 0 ? episode.vote_average : existing.voteAverage,
          runtime: episode.runtime ?? existing.runtime,
          updatedAt: new Date(),
        },
      });
    }
  });
}

export async function syncShowEpisodeCatalog(
  tmdbShowId: number,
  options: { force?: boolean } = {},
): Promise<CatalogSyncResult> {
  const show = await tmdbFetch<TmdbShowSummary>(`/tv/${tmdbShowId}`);
  const expectedEpisodes = Math.max(0, Number(show.number_of_episodes ?? 0));
  const fallbackRuntime = (show.episode_run_time ?? []).find((value) => Number.isFinite(value) && value > 0) ?? 0;
  const estimatedRuntime = fallbackRuntime > 0 && expectedEpisodes > 0 ? Math.round(fallbackRuntime * expectedEpisodes) : 0;

  await upsertShowCatalog({
    tmdb_id: tmdbShowId,
    name: show.name,
    poster_path: show.poster_path,
    backdrop_path: show.backdrop_path,
    overview: show.overview,
    first_air_date: show.first_air_date,
    vote_average: show.vote_average,
    number_of_episodes: show.number_of_episodes,
    number_of_seasons: show.number_of_seasons,
    total_runtime_minutes: estimatedRuntime,
    genres: show.genres,
  });

  const knownEpisodes = await prisma.episode.count({
    where: {
      tmdbShowId,
    },
  });

  const shouldSync = options.force || expectedEpisodes === 0 || knownEpisodes < expectedEpisodes;

  let finalKnown = knownEpisodes;

  if (shouldSync) {
    const seasons = (show.seasons ?? [])
      .filter((season) => season.season_number > 0 && (season.episode_count ?? 0) > 0)
      .map((season) => season.season_number);

    for (const seasonNumber of seasons) {
      await upsertSeasonEpisodes(tmdbShowId, seasonNumber);
    }

    finalKnown = await prisma.episode.count({
      where: {
        tmdbShowId,
      },
    });
  }

  const runtimeTotals = await prisma.episode.aggregate({
    where: {
      tmdbShowId,
    },
    _sum: {
      runtime: true,
    },
  });

  await prisma.show.updateMany({
    where: {
      tmdbId: tmdbShowId,
    },
    data: {
      totalRuntimeMinutes: runtimeTotals._sum.runtime ?? 0,
      updatedAt: new Date(),
    },
  });

  await refreshAllUsersShowProgress(tmdbShowId);

  if (!shouldSync) {
    return {
      tmdbShowId,
      synced: false,
      reason: "up_to_date",
      expectedEpisodes,
      knownEpisodes: finalKnown,
    };
  }

  return {
    tmdbShowId,
    synced: true,
    reason:
      expectedEpisodes === 0
        ? "missing_expected_count"
        : knownEpisodes === 0
          ? "incomplete"
          : "new_episodes",
    expectedEpisodes,
    knownEpisodes: finalKnown,
  };
}
