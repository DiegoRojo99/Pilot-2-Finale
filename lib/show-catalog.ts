import { prisma } from "@/lib/prisma";
import { tmdbFetch } from "@/lib/tmdb";
import type { ShowRecord, TMDBShow } from "@/types";

const PLACEHOLDER_SHOW_NAME_PREFIX = "TMDB Show ";

type ShowCatalogInput = {
  tmdb_id: number;
  name?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string | null;
  first_air_date?: string | null;
  vote_average?: number | null;
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
  total_runtime_minutes?: number | null;
  genres?: Array<{ id: number; name: string }> | null;
};

type UpsertShowCatalogOptions = {
  allowNameUpdate?: boolean;
};

function isPlaceholderName(name: string | null | undefined) {
  return Boolean(name && name.startsWith(PLACEHOLDER_SHOW_NAME_PREFIX));
}

export function isIncompleteShowCatalog(show: Partial<ShowRecord>) {
  return (
    !show.name ||
    isPlaceholderName(show.name) ||
    !show.poster_path ||
    (show.number_of_seasons ?? 0) <= 0 ||
    (show.number_of_episodes ?? 0) <= 0
  );
}

function normalizeShowCatalogInput(input: ShowCatalogInput): Required<ShowCatalogInput> {
  return {
    tmdb_id: input.tmdb_id,
    name: input.name?.trim() || `${PLACEHOLDER_SHOW_NAME_PREFIX}${input.tmdb_id}`,
    poster_path: input.poster_path ?? null,
    backdrop_path: input.backdrop_path ?? null,
    overview: input.overview ?? null,
    first_air_date: input.first_air_date ?? null,
    vote_average: input.vote_average ?? 0,
    number_of_seasons: input.number_of_seasons ?? 0,
    number_of_episodes: input.number_of_episodes ?? 0,
    total_runtime_minutes: Math.max(0, Number(input.total_runtime_minutes ?? 0)),
    genres: Array.isArray(input.genres) ? input.genres : [],
  };
}

function resolveCatalogName(inputName: string | null | undefined, tmdbId: number) {
  const trimmed = inputName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : `${PLACEHOLDER_SHOW_NAME_PREFIX}${tmdbId}`;
}

async function syncShowGenres(showTmdbId: number, genres: Array<{ id: number; name: string }>) {
  const uniqueGenres = Array.from(
    new Map(
      genres
        .filter((genre) => Number.isFinite(genre.id) && typeof genre.name === "string" && genre.name.trim().length > 0)
        .map((genre) => [genre.id, { id: Number(genre.id), name: genre.name.trim() }]),
    ).values(),
  );

  await prisma.showGenre.deleteMany({
    where: {
      showTmdbId,
    },
  });

  if (uniqueGenres.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const genre of uniqueGenres) {
      await tx.genre.upsert({
        where: {
          id: genre.id,
        },
        create: {
          id: genre.id,
          name: genre.name,
        },
        update: {
          name: genre.name,
          updatedAt: new Date(),
        },
      });
    }

    await tx.showGenre.createMany({
      data: uniqueGenres.map((genre) => ({
        showTmdbId,
        genreId: genre.id,
      })),
      skipDuplicates: true,
    });
  });
}

export async function upsertShowCatalog(input: ShowCatalogInput, options: UpsertShowCatalogOptions = {}) {
  const normalized = normalizeShowCatalogInput(input);
  const shouldUpdateName = options.allowNameUpdate ?? false;
  const catalogName = resolveCatalogName(normalized.name, normalized.tmdb_id);
  const normalizedVoteAverage = normalized.vote_average ?? 0;
  const normalizedNumberOfSeasons = normalized.number_of_seasons ?? 0;
  const normalizedNumberOfEpisodes = normalized.number_of_episodes ?? 0;
  const normalizedTotalRuntimeMinutes = normalized.total_runtime_minutes ?? 0;

  const existing = await prisma.show.findUnique({
    where: {
      tmdbId: normalized.tmdb_id,
    },
  });

  if (!existing) {
    await prisma.show.create({
      data: {
        tmdbId: normalized.tmdb_id,
        name: catalogName,
        posterPath: normalized.poster_path,
        backdropPath: normalized.backdrop_path,
        overview: normalized.overview,
        firstAirDate: normalized.first_air_date,
        voteAverage: normalizedVoteAverage,
        numberOfSeasons: normalizedNumberOfSeasons,
        numberOfEpisodes: normalizedNumberOfEpisodes,
        totalRuntimeMinutes: normalizedTotalRuntimeMinutes,
      },
    });
  } else {
    const resolvedName: string =
      !shouldUpdateName
        ? existing.name
        : isPlaceholderName(catalogName) && !isPlaceholderName(existing.name)
          ? existing.name
          : catalogName;

    await prisma.show.update({
      where: {
        tmdbId: normalized.tmdb_id,
      },
      data: {
        name: resolvedName,
        posterPath: normalized.poster_path ?? existing.posterPath,
        backdropPath: normalized.backdrop_path ?? existing.backdropPath,
        overview: normalized.overview ?? existing.overview,
        firstAirDate: normalized.first_air_date ?? existing.firstAirDate,
        voteAverage: normalizedVoteAverage > 0 ? normalizedVoteAverage : existing.voteAverage,
        numberOfSeasons: normalizedNumberOfSeasons > 0 ? normalizedNumberOfSeasons : existing.numberOfSeasons,
        numberOfEpisodes: normalizedNumberOfEpisodes > 0 ? normalizedNumberOfEpisodes : existing.numberOfEpisodes,
        totalRuntimeMinutes:
          normalizedTotalRuntimeMinutes > 0 ? normalizedTotalRuntimeMinutes : existing.totalRuntimeMinutes,
        updatedAt: new Date(),
      },
    });
  }

  const genres = normalized.genres ?? [];
  if (genres.length === 0) return;
  await syncShowGenres(normalized.tmdb_id, genres);
}

export async function fetchAndStoreShowCatalog(tmdbId: number, options: UpsertShowCatalogOptions = {}) {
  const show = await tmdbFetch<TMDBShow>(`/tv/${tmdbId}`);
  const fallbackRuntime = (show.episode_run_time ?? []).find((value) => Number.isFinite(value) && value > 0) ?? 0;
  const totalRuntimeEstimate = fallbackRuntime > 0 && (show.number_of_episodes ?? 0) > 0
    ? Math.round(fallbackRuntime * (show.number_of_episodes ?? 0))
    : 0;

  await upsertShowCatalog({
    tmdb_id: show.id,
    name: show.name,
    poster_path: show.poster_path,
    backdrop_path: show.backdrop_path,
    overview: show.overview,
    first_air_date: show.first_air_date,
    vote_average: show.vote_average,
    number_of_seasons: show.number_of_seasons,
    number_of_episodes: show.number_of_episodes,
    total_runtime_minutes: totalRuntimeEstimate,
    genres: show.genres ?? [],
  }, options);
}

export async function repairShowCatalogIfNeeded(show: Partial<ShowRecord> & { tmdb_id: number }) {
  if (!isIncompleteShowCatalog(show)) return false;
  await fetchAndStoreShowCatalog(show.tmdb_id, { allowNameUpdate: true });
  return true;
}