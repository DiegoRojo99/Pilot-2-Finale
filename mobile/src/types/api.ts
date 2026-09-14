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
};

export type TMDBSearchResult = {
  page: number;
  results: TMDBShow[];
  total_pages: number;
  total_results: number;
};