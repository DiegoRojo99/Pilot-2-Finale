"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Clock } from "lucide-react";
import { getEpisodeLogs } from "@/lib/api";
import { episodeKey, formatDate, getPosterUrl } from "@/lib/utils";
import { PageShell } from "@/components/layout/PageShell";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageLoader } from "@/components/ui/LoadingSpinner";

export default function HistoryPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["episode-logs"],
    queryFn: () => getEpisodeLogs(),
    staleTime: 30_000,
  });

  return (
    <PageShell title="Watch History">
      {isLoading && <PageLoader />}
      {error && <ErrorMessage message="Failed to load history" onRetry={() => void refetch()} />}
      {data && (
        <>
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
              <CheckSquare className="h-12 w-12 opacity-30" />
              <p className="text-center text-sm">
                No episodes logged yet.
                <br />
                Start tracking your watched episodes!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {data.map((log) => (
                <div key={log.id} className="flex items-center gap-3 rounded-xl bg-slate-800/60 p-3">
                  {log.poster_path && (
                    <Image
                      src={getPosterUrl(log.poster_path, "w185")}
                      alt={log.show_name ?? "Poster"}
                      width={40}
                      height={56}
                      className="h-14 w-10 shrink-0 rounded-lg bg-slate-700 object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-blue-400">
                      {episodeKey(log.season_number, log.episode_number)}
                    </p>
                    <p className="truncate text-sm font-medium text-slate-200">
                      {log.episode_name || `Episode ${log.episode_number}`}
                    </p>
                    <p className="truncate text-xs text-slate-400">{log.show_name}</p>
                    {log.rating !== null && log.rating !== undefined ? (
                      <p className="mt-0.5 text-xs text-amber-400">★ {log.rating}/10</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Clock className="h-3 w-3 text-slate-600" />
                    <p className="text-xs text-slate-500">{log.watched_at ? formatDate(log.watched_at) : "No date"}</p>
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
