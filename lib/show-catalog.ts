import db from "@/lib/db";
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
  };
}

export async function upsertShowCatalog(input: ShowCatalogInput) {
  const normalized = normalizeShowCatalogInput(input);

  await db.query(
    `
    INSERT INTO shows (
      tmdb_id,
      name,
      poster_path,
      backdrop_path,
      overview,
      first_air_date,
      vote_average,
      number_of_seasons,
      number_of_episodes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT(tmdb_id) DO UPDATE SET
      name = CASE
        WHEN excluded.name LIKE 'TMDB Show %' AND shows.name IS NOT NULL AND shows.name NOT LIKE 'TMDB Show %' THEN shows.name
        ELSE excluded.name
      END,
      poster_path = COALESCE(excluded.poster_path, shows.poster_path),
      backdrop_path = COALESCE(excluded.backdrop_path, shows.backdrop_path),
      overview = COALESCE(excluded.overview, shows.overview),
      first_air_date = COALESCE(excluded.first_air_date, shows.first_air_date),
      vote_average = CASE WHEN excluded.vote_average > 0 THEN excluded.vote_average ELSE shows.vote_average END,
      number_of_seasons = CASE WHEN excluded.number_of_seasons > 0 THEN excluded.number_of_seasons ELSE shows.number_of_seasons END,
      number_of_episodes = CASE WHEN excluded.number_of_episodes > 0 THEN excluded.number_of_episodes ELSE shows.number_of_episodes END,
      updated_at = now()
    `,
    [
      normalized.tmdb_id,
      normalized.name,
      normalized.poster_path,
      normalized.backdrop_path,
      normalized.overview,
      normalized.first_air_date,
      normalized.vote_average,
      normalized.number_of_seasons,
      normalized.number_of_episodes,
    ],
  );
}

export async function fetchAndStoreShowCatalog(tmdbId: number) {
  const show = await tmdbFetch<TMDBShow>(`/tv/${tmdbId}`);

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
  });
}

export async function repairShowCatalogIfNeeded(show: Partial<ShowRecord> & { tmdb_id: number }) {
  if (!isIncompleteShowCatalog(show)) {
    return false;
  }

  await fetchAndStoreShowCatalog(show.tmdb_id);
  return true;
}