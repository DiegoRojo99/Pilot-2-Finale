import { apiRequest } from '@/lib/api';
import type { EpisodeBatchResponse } from '@/types/api';

export function getShowEpisodeLogsBatch(tmdbShowIds: number[]) {
  return apiRequest<EpisodeBatchResponse>('/api/episodes/batch', {
    method: 'POST',
    body: JSON.stringify({ tmdb_show_ids: tmdbShowIds }),
  });
}