import { useQuery } from '@tanstack/react-query';
import { BarChart2, Tv, BookOpen, CheckCircle, Bookmark, PauseCircle } from 'lucide-react';
import { getStats, getMyShows } from '../api';
import { PageShell } from '../components/layout/PageShell';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';

import type { UserShow } from '../types';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl ${color} bg-opacity-10`}>
      <div className="opacity-80">{icon}</div>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-xs text-slate-400 text-center leading-tight">{label}</p>
    </div>
  );
}

export default function StatsPage() {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
    staleTime: 30_000,
  });

  const { data: recentShows } = useQuery({
    queryKey: ['my-shows'],
    queryFn: () => getMyShows(),
    staleTime: 30_000,
  });

  if (statsLoading) return <PageShell title="Stats"><PageLoader /></PageShell>;
  if (statsError) return <PageShell title="Stats"><ErrorMessage message="Failed to load stats" onRetry={refetch} /></PageShell>;

  return (
    <PageShell title="Stats">
      {stats && (
        <>
          {/* Main stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard
              icon={<BookOpen className="w-6 h-6 text-blue-400" />}
              label="Episodes Watched"
              value={stats.totalEpisodes}
              color="bg-blue-900"
            />
            <StatCard
              icon={<Tv className="w-6 h-6 text-purple-400" />}
              label="Total Shows"
              value={stats.totalShows}
              color="bg-purple-900"
            />
            <StatCard
              icon={<BarChart2 className="w-6 h-6 text-cyan-400" />}
              label="Currently Watching"
              value={stats.watchingShows}
              color="bg-cyan-900"
            />
            <StatCard
              icon={<CheckCircle className="w-6 h-6 text-green-400" />}
              label="Completed"
              value={stats.watchedShows}
              color="bg-green-900"
            />
          </div>

          {/* Additional metrics */}
          <div className="bg-slate-800/60 rounded-2xl p-4 mb-6">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Breakdown</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-slate-300">Want to Watch</span>
                </div>
                <span className="text-sm font-semibold text-slate-200">{stats.wantToWatch}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PauseCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-slate-300">On Hold / Dropped</span>
                </div>
                <span className="text-sm font-semibold text-slate-200">
                  {stats.totalShows - stats.watchingShows - stats.watchedShows - stats.wantToWatch}
                </span>
              </div>
            </div>
          </div>

          {/* Recent activity */}
          {recentShows && recentShows.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-300 mb-3">Recently Updated</h2>
              <div className="flex flex-col gap-2">
                {recentShows.slice(0, 5).map((show: UserShow) => (
                  <div key={show.tmdb_id} className="flex items-center gap-3 p-2.5 bg-slate-800/40 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{show.name}</p>
                      <p className="text-xs text-slate-500">{show.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
