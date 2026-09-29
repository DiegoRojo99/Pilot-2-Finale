import type { TMDBEpisode } from '@/types/tmdb';

/**
 * Determine if an episode is unreleased based on its air date.
 * An episode is considered unreleased if:
 * - It has no air_date, OR
 * - Its air_date is in the future
 */
export function isEpisodeUnreleased(episode: TMDBEpisode | null | undefined): boolean {
  if (!episode) return true;
  if (!episode.air_date) return true;

  // Parse the air_date (format: YYYY-MM-DD)
  const airDate = new Date(episode.air_date);
  const today = new Date();
  
  // Reset time to start of day for accurate comparison
  today.setUTCHours(0, 0, 0, 0);
  airDate.setUTCHours(0, 0, 0, 0);

  return airDate > today;
}

/**
 * Decorate an episode with an isUnreleased flag.
 * Returns the episode with the additional flag for frontend consumption.
 */
export function decorateEpisodeWithReleaseStatus<T extends TMDBEpisode>(
  episode: T,
): T & { isUnreleased: boolean } {
  return {
    ...episode,
    isUnreleased: isEpisodeUnreleased(episode),
  };
}

/**
 * Filter out unreleased episodes from a list.
 * Useful for displaying only watchable episodes.
 */
export function filterReleasedEpisodes(episodes: TMDBEpisode[]): TMDBEpisode[] {
  return episodes.filter((episode) => !isEpisodeUnreleased(episode));
}

/**
 * Filter for unreleased episodes from a list.
 * Useful for displaying upcoming episodes.
 */
export function filterUnreleasedEpisodes(episodes: TMDBEpisode[]): TMDBEpisode[] {
  return episodes.filter((episode) => isEpisodeUnreleased(episode));
}

/**
 * Decorate all episodes in a list with release status.
 */
export function decorateEpisodesWithReleaseStatus<T extends TMDBEpisode>(
  episodes: T[],
): (T & { isUnreleased: boolean })[] {
  return episodes.map((episode) => decorateEpisodeWithReleaseStatus(episode));
}
