"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, BookOpen, Bookmark, CheckCircle, PauseCircle, Tv } from "lucide-react";
import { getMyShows, getStats } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageLoader } from "@/components/ui/LoadingSpinner";

type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: number;
  color: string;
};

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl p-4 ${color} bg-opacity-10`}>
      <div className="opacity-80">{icon}</div>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-center text-xs leading-tight text-slate-400">{label}</p>
    </div>
  );
}

export default function StatsPage() {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
    staleTime: 30_000,
  });

  const { data: recentShows } = useQuery({
    queryKey: ["my-shows"],
    queryFn: () => getMyShows(),
    staleTime: 30_000,
  });

  if (statsLoading) {
    return (
      <PageShell title="Stats">
        <PageLoader />
      </PageShell>
    );
  }

  if (statsError) {
    return (
      <PageShell title="Stats">
        <ErrorMessage message="Failed to load stats" onRetry={() => void refetch()} />
      </PageShell>
    );
  }

  return (
    <PageShell title="Stats">
      {stats && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <StatCard
              icon={<BookOpen className="h-6 w-6 text-blue-400" />}
              label="Episodes Watched"
              value={stats.totalEpisodes}
              color="bg-blue-900"
            />
            <StatCard
              icon={<Tv className="h-6 w-6 text-purple-400" />}
              label="Total Shows"
              value={stats.totalShows}
              color="bg-purple-900"
            />
            <StatCard
              icon={<BarChart2 className="h-6 w-6 text-cyan-400" />}
              label="Currently Watching"
              value={stats.watchingShows}
              color="bg-cyan-900"
            />
            <StatCard
              icon={<CheckCircle className="h-6 w-6 text-green-400" />}
              label="Completed"
              value={stats.watchedShows}
              color="bg-green-900"
            />
          </div>

          <div className="mb-6 rounded-2xl bg-slate-800/60 p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-300">Breakdown</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-slate-300">Want to Watch</span>
                </div>
                <span className="text-sm font-semibold text-slate-200">{stats.wantToWatch}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PauseCircle className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm text-slate-300">On Hold / Dropped</span>
                </div>
                <span className="text-sm font-semibold text-slate-200">
                  {stats.totalShows - stats.watchingShows - stats.watchedShows - stats.wantToWatch}
                </span>
              </div>
            </div>
          </div>

          {recentShows && recentShows.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-300">Recently Updated</h2>
              <div className="flex flex-col gap-2">
                {recentShows.slice(0, 5).map((show) => (
                  <div key={show.tmdb_id} className="flex items-center gap-3 rounded-xl bg-slate-800/40 p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-200">{show.name}</p>
                      <p className="text-xs text-slate-500">{show.status.replace("_", " ")}</p>
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
