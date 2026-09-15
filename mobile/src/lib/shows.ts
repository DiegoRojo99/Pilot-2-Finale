import { apiRequest } from '@/lib/api';
import type { ShowStatus, TMDBSearchResult, TMDBSeason, TMDBShow, UserShow } from '@/types/api';

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

export function getShowDetails(id: number) {
  return apiRequest<TMDBShow>(`/api/shows/${id}`);
}

export function getUserShowDetails(id: number) {
  return apiRequest<UserShow>(`/api/my-shows/${id}`);
}

export function getSeasonDetails(showId: number, seasonNumber: number) {
  return apiRequest<TMDBSeason>(`/api/shows/${showId}/season/${seasonNumber}`);
}

export function getMyShows(status?: ShowStatus) {
  return apiRequest<UserShow[]>(status ? `/api/my-shows?status=${status}` : '/api/my-shows');
}