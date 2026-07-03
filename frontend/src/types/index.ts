// TMDB API Types
export interface TMDBShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  networks?: { id: number; name: string; logo_path: string | null }[];
  created_by?: { id: number; name: string }[];
  episode_run_time?: number[];
}

export interface TMDBSeason {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string;
  episodes?: TMDBEpisode[];
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  still_path: string | null;
  vote_average: number;
  runtime: number | null;
}

export interface TMDBSearchResult {
  page: number;
  results: TMDBShow[];
  total_pages: number;
  total_results: number;
}

// User Data Types
export type ShowStatus = 'watching' | 'want_to_watch' | 'watched' | 'dropped' | 'on_hold';

export interface UserShow {
  id: number;
  tmdb_id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  first_air_date: string | null;
  status: ShowStatus;
  vote_average: number;
  number_of_seasons: number;
  number_of_episodes: number;
  added_at: string;
  updated_at: string;
}

export interface EpisodeLog {
  id: number;
  tmdb_show_id: number;
  season_number: number;
  episode_number: number;
  episode_name: string | null;
  watched_at: string;
  rating: number | null;
  notes: string | null;
  show_name?: string;
  poster_path?: string | null;
}

export interface UserStats {
  totalEpisodes: number;
  totalShows: number;
  watchingShows: number;
  watchedShows: number;
  wantToWatch: number;
}

export const STATUS_LABELS: Record<ShowStatus, string> = {
  watching: 'Watching',
  want_to_watch: 'Want to Watch',
  watched: 'Watched',
  dropped: 'Dropped',
  on_hold: 'On Hold',
};

export const STATUS_COLORS: Record<ShowStatus, string> = {
  watching: 'text-blue-400 bg-blue-400/10',
  want_to_watch: 'text-purple-400 bg-purple-400/10',
  watched: 'text-green-400 bg-green-400/10',
  dropped: 'text-red-400 bg-red-400/10',
  on_hold: 'text-yellow-400 bg-yellow-400/10',
};
