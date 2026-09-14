export type HealthResponse = {
  status: string;
  timestamp: string;
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
  status?: string;
};

export type TMDBSearchResult = {
  page: number;
  results: TMDBShow[];
  total_pages: number;
  total_results: number;
};