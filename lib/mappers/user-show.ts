import type { ShowStatus, UserShow, UserShowWithShowRow } from "@/types";

const VALID_STATUSES: ShowStatus[] = ["watching", "want_to_watch", "watched", "dropped", "on_hold"];

function normalizeShowStatus(status: string): ShowStatus {
  return VALID_STATUSES.includes(status as ShowStatus) ? (status as ShowStatus) : "watching";
}

export function mapUserShow(
  row: UserShowWithShowRow,
  options?: { preferUserNameWhenShowIsPlaceholder?: boolean },
): UserShow {
  const preferUserNameWhenShowIsPlaceholder = options?.preferUserNameWhenShowIsPlaceholder ?? false;
  const showNameHasTMDBPrefix = row.show.name.startsWith("TMDB Show ");
  const canUseUserName = typeof row.name === "string" && row.name.trim().length > 0;
  const name: string =
    preferUserNameWhenShowIsPlaceholder && showNameHasTMDBPrefix && canUseUserName
      ? (row.name as string)
      : row.show.name;

  return {
    id: row.id,
    tmdb_id: row.tmdbId,
    name,
    poster_path: row.show.posterPath,
    backdrop_path: row.show.backdropPath,
    overview: row.show.overview,
    first_air_date: row.show.firstAirDate,
    status: normalizeShowStatus(row.status),
    vote_average: row.show.voteAverage,
    number_of_seasons: row.show.numberOfSeasons,
    number_of_episodes: row.show.numberOfEpisodes,
    added_at: row.addedAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}