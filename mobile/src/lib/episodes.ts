import { apiRequest } from '@/lib/api';
import type { EpisodeLog, EpisodeBatchResponse } from '@/types/api';

export function getShowEpisodeLogs(tmdbShowId: number) {
  return apiRequest<EpisodeLog[]>(`/api/episodes/show/${tmdbShowId}`);
}

export function getShowEpisodeLogsBatch(tmdbShowIds: number[]) {
  return apiRequest<EpisodeBatchResponse>('/api/episodes/batch', {
    method: 'POST',
    body: JSON.stringify({ tmdb_show_ids: tmdbShowIds }),
  });
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