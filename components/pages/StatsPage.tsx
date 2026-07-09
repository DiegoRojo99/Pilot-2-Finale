"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { BarChart2, BookOpen, CheckCircle, LogOut, Tv } from "lucide-react";
import { getStats } from "@/lib/api";
import { authClient } from "@/lib/auth/client";
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

export default function ProfilePage() {
  const router = useRouter();
  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
    staleTime: 30_000,
  });

  if (statsLoading) {
    return (
      <PageShell title="Profile">
        <PageLoader />
      </PageShell>
    );
  }

  if (statsError) {
    return (
      <PageShell title="Profile">
        <ErrorMessage message="Failed to load stats" onRetry={() => void refetch()} />
      </PageShell>
    );
  }

  return (
    <PageShell title="Profile">
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
          
          <div className="mb-4 rounded-2xl border border-slate-700 bg-slate-800/60">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-500"
              onClick={async () => {
                await authClient.signOut();
                router.replace("/auth/login");
                router.refresh();
              }}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </>
      )}
    </PageShell>
  );
}
