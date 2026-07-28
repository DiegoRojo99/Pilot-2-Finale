"use client";

import type { LucideIcon } from "lucide-react";
import {
  Award,
  BookOpen,
  CalendarCheck2,
  Clapperboard,
  Clock3,
  Compass,
  Flame,
  ListChecks,
  Medal,
  Star,
  Target,
  Trophy,
  Tv,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAchievements } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import type { UserAchievementProgressView } from "@/types";

const ICON_BY_NAME: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  tv: Tv,
  clapperboard: Clapperboard,
  "clock-3": Clock3,
  flame: Flame,
  "calendar-check-2": CalendarCheck2,
  "list-checks": ListChecks,
  compass: Compass,
  star: Star,
  medal: Medal,
};

const TIER_STYLES: Record<string, string> = {
  bronze: "border-amber-700/60 bg-amber-950/40 text-amber-300",
  silver: "border-slate-400/50 bg-slate-800/70 text-slate-200",
  gold: "border-yellow-500/60 bg-yellow-950/40 text-yellow-300",
  platinum: "border-cyan-500/50 bg-cyan-950/35 text-cyan-300",
  diamond: "border-blue-500/50 bg-blue-950/35 text-blue-300",
};

function resolveIcon(row: UserAchievementProgressView): LucideIcon {
  if (row.achievement.icon_kind === "name" && row.achievement.icon) {
    return ICON_BY_NAME[row.achievement.icon] ?? Trophy;
  }

  return Trophy;
}

function tierBadgeClass(colorToken: string | null) {
  if (!colorToken) {
    return "border-slate-700 bg-slate-800 text-slate-200";
  }

  return TIER_STYLES[colorToken] ?? "border-slate-700 bg-slate-800 text-slate-200";
}

function AchievementsSummary({ rows }: { rows: UserAchievementProgressView[] }) {
  const unlockedCount = rows.filter((row) => row.highest_tier_level > 0).length;
  const diamondCount = rows.filter((row) => row.highest_tier_level >= 5).length;
  const averageProgress =
    rows.length > 0 ? Math.round(rows.reduce((sum, row) => sum + row.progress_percent, 0) / rows.length) : 0;

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">Unlocked</p>
        <p className="mt-1 text-xl font-semibold text-slate-100">{unlockedCount}</p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">Diamond</p>
        <p className="mt-1 text-xl font-semibold text-slate-100">{diamondCount}</p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">Avg Progress</p>
        <p className="mt-1 text-xl font-semibold text-slate-100">{averageProgress}%</p>
      </div>
    </div>
  );
}

function AchievementCard({ row }: { row: UserAchievementProgressView }) {
  const Icon = resolveIcon(row);
  const currentTierName = row.current_tier?.name ?? "Locked";
  const nextTierName = row.next_tier?.name ?? "Max tier";
  const nextTarget = row.next_tier?.required_count ?? row.current_count;

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-200">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{row.achievement.title}</h2>
            <p className="mt-0.5 text-xs text-slate-400">{row.achievement.description}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tierBadgeClass(
            row.current_tier?.color_token ?? null,
          )}`}
        >
          {currentTierName}
        </span>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
          <p>
            {row.current_count} / {nextTarget}
          </p>
          <p>{row.progress_percent}%</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${Math.max(0, Math.min(100, row.progress_percent))}%` }}
          />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Target className="h-3.5 w-3.5" />
          Next: {nextTierName}
        </span>
        <span className="inline-flex items-center gap-1">
          <Award className="h-3.5 w-3.5" />
          Tier {row.highest_tier_level}
        </span>
      </div>
    </article>
  );
}

export default function AchievementsPage() {
  const {
    data: achievements,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["achievements"],
    queryFn: getAchievements,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <PageShell title="Achievements">
        <PageLoader />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Achievements">
        <ErrorMessage message="Failed to load achievements" onRetry={() => void refetch()} />
      </PageShell>
    );
  }

  const rows = (achievements ?? []).slice().sort((a, b) => {
    if (a.highest_tier_level !== b.highest_tier_level) return b.highest_tier_level - a.highest_tier_level;
    if (a.progress_percent !== b.progress_percent) return b.progress_percent - a.progress_percent;
    return a.achievement.sort_order - b.achievement.sort_order;
  });

  return (
    <PageShell title="Achievements" showBack>
      <div className="space-y-3">
        <AchievementsSummary rows={rows} />
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-4 text-sm text-slate-400">
            Start watching and logging episodes to unlock achievements.
          </div>
        ) : (
          <div className="space-y-2.5">
            {rows.map((row) => (
              <AchievementCard key={row.achievement_id} row={row} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
