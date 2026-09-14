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