"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, BookOpen, CheckCircle2, ListChecks, Tv } from "lucide-react";
import { getStats } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageLoader } from "@/components/ui/LoadingSpinner";

type StatRowProps = {
  icon: ReactNode;
  label: string;
  value: number;
};

function StatRow({ icon, label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
      <div className="flex items-center gap-3 text-slate-300">
        <div className="rounded-lg border border-slate-700 p-1.5 text-slate-400">{icon}</div>
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="text-xl font-semibold tabular-nums text-slate-100">{value}</p>
    </div>
  );
}

export default function StatsPage() {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
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
        <div className="space-y-3">
          <p className="px-1 text-xs tracking-wide text-slate-500 uppercase">Basic Stats</p>
          <div className="flex flex-col gap-2.5">
            <StatRow icon={<BookOpen className="h-4 w-4" />} label="Episodes Watched" value={stats.totalEpisodes} />
            <StatRow icon={<Tv className="h-4 w-4" />} label="Total Shows" value={stats.totalShows} />
            <StatRow icon={<Activity className="h-4 w-4" />} label="Currently Watching" value={stats.watchingShows} />
            <StatRow icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={stats.watchedShows} />
            <StatRow icon={<ListChecks className="h-4 w-4" />} label="Watchlist" value={stats.wantToWatch} />
          </div>
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 px-4 py-3">
            <p className="text-xs text-slate-500">More time-based insights will be added here in a future update.</p>
          </div>
        </div>
      )}
    </PageShell>
  );
}
