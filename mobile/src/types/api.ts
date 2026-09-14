export type HealthResponse = {
  status: string;
  timestamp: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  emailVerified?: boolean;
};

export type AuthSession = {
  id: string;
  userId: string;
  expiresAt: string;
  token?: string;
};

export type AuthSessionResponse = {
  session: AuthSession;
  user: AuthUser;
} | null;

export type AuthEmailResponse = {
  token?: string | null;
  user?: AuthUser;
  error?: {
    message?: string;
  };
};

export type ShowStatus = 'watching' | 'want_to_watch' | 'watched' | 'dropped' | 'on_hold';

export type UserShow = {
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
};

export type ShowNextEpisode = {
  tmdb_episode_id: number | null;
  season_number: number;
  episode_number: number;
  episode_name: string | null;
  has_reliable_next: boolean;
};

export type ShowProgress = {
  tmdb_show_id: number;
  watched_unique_count: number;
  number_of_episodes: number;
  next_episode: ShowNextEpisode | null;
};

export type EpisodeBatchResponse = {
  logsByShowId: Record<number, unknown[]>;
  progressByShowId: Record<number, ShowProgress>;
};

export type TMDBShow = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genres?: Array<{ id: number; name: string }>;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: TMDBSeasonSummary[];
  status?: string;
};

export type TMDBSeasonSummary = {
  season_number: number;
  episode_count: number;
  name: string;
  air_date?: string | null;
  poster_path?: string | null;
};

export type TMDBEpisode = {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  still_path: string | null;
  vote_average: number;
  runtime: number | null;
};

export type TMDBSeason = TMDBSeasonSummary & {
  id: number;
  overview: string;
  episodes?: TMDBEpisode[];
};

export type TMDBSearchResult = {
  page: number;
  results: TMDBShow[];
  total_pages: number;
  total_results: number;
};