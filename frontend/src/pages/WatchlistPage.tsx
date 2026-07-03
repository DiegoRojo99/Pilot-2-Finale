import { useQuery } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import { getMyShows } from '../api';
import { PageShell } from '../components/layout/PageShell';
import { UserShowCard } from '../components/show/ShowCard';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';

import type { UserShow } from '../types';

export default function WatchlistPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-shows', 'want_to_watch'],
    queryFn: () => getMyShows('want_to_watch'),
    staleTime: 30_000,
  });

  return (
    <PageShell title="Watchlist">
      {isLoading && <PageLoader />}
      {error && <ErrorMessage message="Failed to load watchlist" onRetry={refetch} />}
      {data && (
        <>
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
              <Bookmark className="w-12 h-12 opacity-30" />
              <p className="text-sm text-center">
                Your watchlist is empty.<br />Save shows to watch later!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {data.map((show: UserShow) => (
                <UserShowCard key={show.tmdb_id} show={show} />
              ))}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
