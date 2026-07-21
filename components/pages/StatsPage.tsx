"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, BookOpen, CheckCircle2, ListChecks, Tv } from "lucide-react";
import { getStats } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import type { StatsPeriod } from "@/types";

const PERIOD_OPTIONS: Array<{ value: StatsPeriod; label: string }> = [
  { value: "l7d", label: "L7D" },
  { value: "l30d", label: "L30D" },
  { value: "ly", label: "Last Year" },
];

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
  const [period, setPeriod] = useState<StatsPeriod>("l30d");

  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useQuery({
    queryKey: ["stats", period],
    queryFn: () => getStats(period),
    staleTime: 30_000,
  });

  const formatMinutes = (minutes: number) => {
    if (minutes <= 0) return "0m";
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;

    if (hours <= 0) return `${remMinutes}m`;
    if (remMinutes === 0) return `${hours}h`;
    return `${hours}h ${remMinutes}m`;
  };

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

          <p className="px-1 pt-2 text-xs tracking-wide text-slate-500 uppercase">Time Spent Watching</p>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2">
            <div className="mb-2 flex items-center gap-1.5">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    period === option.value
                      ? "bg-slate-700 text-slate-100"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex items-end justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2.5">
              <p className="text-xs text-slate-400">Total runtime watched</p>
              <p className="text-lg font-semibold tabular-nums text-slate-100">{formatMinutes(stats.timeSpentMinutes)}</p>
            </div>
          </div>

          <p className="px-1 pt-2 text-xs tracking-wide text-slate-500 uppercase">Pending (Watching)</p>
          <div className="flex flex-col gap-2.5">
            <StatRow
              icon={<Activity className="h-4 w-4" />}
              label="Episodes Left"
              value={stats.pendingEpisodesWatching}
            />
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              <p className="text-sm font-medium text-slate-300">Estimated Time Left</p>
              <p className="text-xl font-semibold tabular-nums text-slate-100">{formatMinutes(stats.pendingRuntimeMinutesWatching)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 px-4 py-3">
            <p className="text-xs text-slate-500">More time-based insights will be added here in a future update.</p>
          </div>
        </div>
      )}
    </PageShell>
  );
}
