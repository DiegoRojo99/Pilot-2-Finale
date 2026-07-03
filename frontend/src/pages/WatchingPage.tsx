import { useQuery } from '@tanstack/react-query';
import { Tv } from 'lucide-react';
import { getMyShows } from '../api';
import { PageShell } from '../components/layout/PageShell';
import { UserShowCard } from '../components/show/ShowCard';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';

import type { UserShow } from '../types';

export default function WatchingPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-shows', 'watching'],
    queryFn: () => getMyShows('watching'),
    staleTime: 30_000,
  });

  return (
    <PageShell title="Watching">
      {isLoading && <PageLoader />}
      {error && <ErrorMessage message="Failed to load shows" onRetry={refetch} />}
      {data && (
        <>
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
              <Tv className="w-12 h-12 opacity-30" />
              <p className="text-sm text-center">
                No shows being watched.<br />Search and add some!
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
