import type { ShowStatus, UserShow, UserShowWithShowRow } from "@/types";
import { isEpisodeUnreleased } from "@/lib/episodes";

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

  // Only show next episode if it's released (aired)
  const isNextEpisodeUnreleased = row.nextEpisodeToWatch?.airDate
    ? isEpisodeUnreleased({ air_date: row.nextEpisodeToWatch.airDate } as any)
    : false;

  const nextEpisode = row.nextEpisodeToWatch && !isNextEpisodeUnreleased ? {
    tmdb_episode_id: row.nextEpisodeToWatch.tmdbEpisodeId,
    season_number: row.nextEpisodeToWatch.seasonNumber,
    episode_number: row.nextEpisodeToWatch.episodeNumber,
    episode_name: row.nextEpisodeToWatch.name,
    has_reliable_next: true,
  } : null;

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
    remaining_episodes_count: row.remainingEpisodesCount,
    added_at: row.addedAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    next_episode: nextEpisode,
  };
}