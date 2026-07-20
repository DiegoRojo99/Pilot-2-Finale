import db from "@/lib/db";
import { tmdbFetch } from "@/lib/tmdb";

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

  await db.query(
    `
      INSERT INTO episodes (
        tmdb_episode_id,
        tmdb_show_id,
        season_number,
        episode_number,
        name,
        overview,
        air_date,
        still_path,
        vote_average,
        runtime
      )
      SELECT
        episode.tmdb_episode_id,
        episode.tmdb_show_id,
        episode.season_number,
        episode.episode_number,
        episode.name,
        episode.overview,
        episode.air_date,
        episode.still_path,
        episode.vote_average,
        episode.runtime
      FROM jsonb_to_recordset($1::jsonb) AS episode(
        tmdb_episode_id INTEGER,
        tmdb_show_id INTEGER,
        season_number INTEGER,
        episode_number INTEGER,
        name TEXT,
        overview TEXT,
        air_date TEXT,
        still_path TEXT,
        vote_average DOUBLE PRECISION,
        runtime INTEGER
      )
      ON CONFLICT (tmdb_show_id, season_number, episode_number) DO UPDATE SET
        tmdb_episode_id = COALESCE(excluded.tmdb_episode_id, episodes.tmdb_episode_id),
        name = COALESCE(excluded.name, episodes.name),
        overview = COALESCE(excluded.overview, episodes.overview),
        air_date = COALESCE(excluded.air_date, episodes.air_date),
        still_path = COALESCE(excluded.still_path, episodes.still_path),
        vote_average = CASE WHEN excluded.vote_average > 0 THEN excluded.vote_average ELSE episodes.vote_average END,
        runtime = COALESCE(excluded.runtime, episodes.runtime),
        updated_at = now()
    `,
    [JSON.stringify(payload)],
  );
}

export async function syncShowEpisodeCatalog(tmdbShowId: number): Promise<CatalogSyncResult> {
  const show = await tmdbFetch<TmdbShowSummary>(`/tv/${tmdbShowId}`);
  const expectedEpisodes = Math.max(0, Number(show.number_of_episodes ?? 0));

  await db.query(
    `
      UPDATE shows
      SET
        poster_path = COALESCE($2, poster_path),
        backdrop_path = COALESCE($3, backdrop_path),
        overview = COALESCE($4, overview),
        first_air_date = COALESCE($5, first_air_date),
        vote_average = CASE WHEN COALESCE($6, 0) > 0 THEN $6 ELSE vote_average END,
        number_of_episodes = COALESCE($7, number_of_episodes),
        number_of_seasons = COALESCE($8, number_of_seasons),
        updated_at = now()
      WHERE tmdb_id = $1
    `,
    [
      tmdbShowId,
      show.poster_path ?? null,
      show.backdrop_path ?? null,
      show.overview ?? null,
      show.first_air_date ?? null,
      show.vote_average ?? null,
      show.number_of_episodes ?? null,
      show.number_of_seasons ?? null,
    ],
  );

  const knownEpisodesResult = await db.one<{ known_episodes: number }>(
    "SELECT COUNT(*)::int AS known_episodes FROM episodes WHERE tmdb_show_id = $1",
    [tmdbShowId],
  );
  const knownEpisodes = knownEpisodesResult?.known_episodes ?? 0;

  const shouldSync = expectedEpisodes === 0 || knownEpisodes < expectedEpisodes;

  if (!shouldSync) {
    return {
      tmdbShowId,
      synced: false,
      reason: "up_to_date",
      expectedEpisodes,
      knownEpisodes,
    };
  }

  const seasons = (show.seasons ?? [])
    .filter((season) => season.season_number > 0 && (season.episode_count ?? 0) > 0)
    .map((season) => season.season_number);

  for (const seasonNumber of seasons) {
    await upsertSeasonEpisodes(tmdbShowId, seasonNumber);
  }

  const finalKnown =
    (await db.one<{ known_episodes: number }>(
      "SELECT COUNT(*)::int AS known_episodes FROM episodes WHERE tmdb_show_id = $1",
      [tmdbShowId],
    ))?.known_episodes ?? knownEpisodes;

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
