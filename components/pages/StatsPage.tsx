"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowRight, Award, BookOpen, CheckCircle2, ListChecks, Tv } from "lucide-react";
import { getAchievements, getStats } from "@/lib/api";
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

  const { data: achievements } = useQuery({
    queryKey: ["achievements"],
    queryFn: getAchievements,
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
          <p className="px-1 text-xs tracking-wide text-slate-500 uppercase">Achievements</p>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">Your Progress</p>
                <p className="text-xs text-slate-400">Preview of your active achievement tiers.</p>
              </div>
              <Award className="h-5 w-5 text-amber-400" />
            </div>

            {(() => {
              const rows = (achievements ?? []).slice().sort((a, b) => {
                if (a.highest_tier_level !== b.highest_tier_level) return b.highest_tier_level - a.highest_tier_level;
                return b.progress_percent - a.progress_percent;
              });
              const preview = rows.slice(0, 3);

              if (preview.length === 0) {
                return (
                  <p className="mb-3 rounded-lg border border-dashed border-slate-800 bg-slate-900/30 px-3 py-2 text-xs text-slate-400">
                    No achievement progress yet. Start logging episodes to begin unlocking tiers.
                  </p>
                );
              }

              return (
                <div className="mb-3 space-y-2">
                  {preview.map((item) => (
                    <div key={item.achievement_id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                        <p className="truncate font-medium text-slate-200">{item.achievement.title}</p>
                        <p className="text-slate-400">{item.progress_percent}%</p>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${Math.max(0, Math.min(100, item.progress_percent))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <Link
              href="/achievements"
              className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
            >
              View All Achievements
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

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
