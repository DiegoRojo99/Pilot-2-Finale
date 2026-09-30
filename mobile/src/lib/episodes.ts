import { apiRequest } from '@/lib/api';
import type { EpisodeLog, EpisodeStatsPeriod, EpisodeStatsResponse, UpcomingEpisodesResponse } from '@/types/episode';

export function getShowEpisodeLogs(tmdbShowId: number) {
  return apiRequest<EpisodeLog[]>(`/api/episodes/show/${tmdbShowId}`);
}

export function getStats(period: EpisodeStatsPeriod) {
  return apiRequest<EpisodeStatsResponse>(`/api/episodes/stats?period=${period}`);
}

export function getUpcomingEpisodes(status: string = 'watching') {
  return apiRequest<UpcomingEpisodesResponse>(`/api/episodes/upcoming?status=${status}`);
}

export function getAllEpisodeLogs(limit?: number) {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  return apiRequest<EpisodeLog[]>(`/api/episodes?${params.toString()}`);
}

export function logEpisode(data: {
  tmdb_show_id: number;
  tmdb_episode_id?: number;
  season_number: number;
  episode_number: number;
  episode_name?: string;
  rating?: number;
  notes?: string;
  watched_at?: string | null;
}) {
  return apiRequest<EpisodeLog>('/api/episodes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function logEpisodesBulk(data: {
  tmdb_show_id: number;
  episodes: Array<{
    tmdb_episode_id?: number;
    season_number: number;
    episode_number: number;
    episode_name?: string;
    rating?: number;
    notes?: string;
    watched_at?: string | null;
  }>;
}) {
  return apiRequest<{ count: number }>('/api/episodes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateEpisodeLog(
  entryId: number,
  data: {
    rating?: number | null;
    notes?: string;
    watched_at?: string | null;
  }
) {
  return apiRequest<EpisodeLog>(`/api/episodes/${entryId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteEpisodeLog(entryId: number) {
  return apiRequest<{ success: boolean }>(`/api/episodes/${entryId}`, {
    method: 'DELETE',
  });
}