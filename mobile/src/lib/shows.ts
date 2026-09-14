import { apiRequest } from '@/lib/api';
import type { TMDBSearchResult } from '@/types/api';

export function searchShows(query: string, page = 1) {
  const params = new URLSearchParams({ query, page: String(page) });

  return apiRequest<TMDBSearchResult>(`/api/shows/search?${params.toString()}`);
}

export function getTrendingShows() {
  return apiRequest<TMDBSearchResult>('/api/shows/trending/week');
}

export function getTopRatedShows(page = 1) {
  return apiRequest<TMDBSearchResult>(`/api/shows/top-rated?page=${page}`);
}