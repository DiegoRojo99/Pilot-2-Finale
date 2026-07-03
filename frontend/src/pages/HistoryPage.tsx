import { useQuery } from '@tanstack/react-query';
import { CheckSquare, Clock } from 'lucide-react';
import { getEpisodeLogs } from '../api';
import { PageShell } from '../components/layout/PageShell';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { getPosterUrl, episodeKey, formatDate } from '../utils';
import type { EpisodeLog } from '../types';

export default function HistoryPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['episode-logs'],
    queryFn: () => getEpisodeLogs(),
    staleTime: 30_000,
  });

  return (
    <PageShell title="Watch History">
      {isLoading && <PageLoader />}
      {error && <ErrorMessage message="Failed to load history" onRetry={refetch} />}
      {data && (
        <>
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
              <CheckSquare className="w-12 h-12 opacity-30" />
              <p className="text-sm text-center">
                No episodes logged yet.<br />Start tracking your watched episodes!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {data.map((log: EpisodeLog) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl"
                >
                  {log.poster_path && (
                    <img
                      src={getPosterUrl(log.poster_path, 'w185')}
                      alt={log.show_name}
                      className="w-10 h-14 object-cover rounded-lg flex-shrink-0 bg-slate-700"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-400">
                      {episodeKey(log.season_number, log.episode_number)}
                    </p>
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {log.episode_name || 'Episode ' + log.episode_number}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{log.show_name}</p>
                    {log.rating && (
                      <p className="text-xs text-amber-400 mt-0.5">★ {log.rating}/10</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <Clock className="w-3 h-3 text-slate-600" />
                    <p className="text-xs text-slate-500">{formatDate(log.watched_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
