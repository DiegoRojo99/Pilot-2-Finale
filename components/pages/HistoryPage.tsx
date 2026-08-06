"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckSquare, Film, PencilLine, Trash2 } from "lucide-react";
import { getEpisodeLogs, removeEpisodeLogById, updateEpisodeLog } from "@/lib/api";
import { episodeKey, formatDate, getPosterUrl } from "@/lib/utils";
import { PageShell } from "@/components/layout/PageShell";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { EpisodeDiaryModal } from "@/components/show/EpisodeDiaryModal";
import type { EpisodeLog } from "@/types";

function DiaryRowActions({
  onEdit,
  onDelete,
  isDeleting,
}: {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit watch log"
        title="Edit watch log"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-slate-200 active:bg-slate-600"
      >
        <PencilLine className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting}
        aria-label="Delete watch log"
        title="Delete watch log"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15 text-red-300 active:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const [editingLog, setEditingLog] = useState<EpisodeLog | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["episode-logs"],
    queryFn: () => getEpisodeLogs(undefined, { withWatchDate: true }),
    staleTime: 30_000,
  });

  const updateEpisodeLogMutation = useMutation({
    mutationFn: async ({
      logId,
      watchedAt,
      rating,
    }: {
      logId: number;
      watchedAt: string | null;
      rating: number | null;
    }) =>
      updateEpisodeLog(logId, {
        watched_at: watchedAt,
        rating,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["episode-logs"] });
      void queryClient.invalidateQueries({ queryKey: ["episode-logs-batch"] });
      void queryClient.invalidateQueries({ queryKey: ["my-shows"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      setEditingLog(null);
    },
  });

  const deleteEpisodeLogMutation = useMutation({
    mutationFn: async (logId: number) => removeEpisodeLogById(logId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["episode-logs"] });
      void queryClient.invalidateQueries({ queryKey: ["episode-logs-batch"] });
      void queryClient.invalidateQueries({ queryKey: ["my-shows"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onSettled: () => setDeletingLogId(null),
  });

  const diaryGroups = useMemo(() => {
    const sortedLogs = [...(data ?? [])].sort((left, right) => {
      const leftTime = left.watched_at ? new Date(left.watched_at).getTime() : 0;
      const rightTime = right.watched_at ? new Date(right.watched_at).getTime() : 0;
      return rightTime - leftTime;
    });

    const groups = new Map<string, typeof sortedLogs>();

    for (const log of sortedLogs) {
      const groupKey = log.watched_at ? log.watched_at.slice(0, 10) : "no-date";
      const currentGroup = groups.get(groupKey) ?? [];
      currentGroup.push(log);
      groups.set(groupKey, currentGroup);
    }

    return Array.from(groups.entries()).map(([groupKey, logs]) => ({
      groupKey,
      label: groupKey === "no-date" ? "No watch date" : formatDate(logs[0]?.watched_at ?? null),
      logs,
    }));
  }, [data]);

  return (
    <PageShell title="Diary">
      {isLoading && <PageLoader />}
      {error && <ErrorMessage message="Failed to load history" onRetry={() => void refetch()} />}
      {data && (
        <div className="space-y-4">
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-800/40 px-4 py-16 text-slate-500">
              <CheckSquare className="h-12 w-12 opacity-30" />
              <p className="text-center text-sm">
                No episodes with a watch date yet.
                <br />
                Add a watch date to see entries in history.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {diaryGroups.map((group) => (
                <section key={group.groupKey} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-100">{group.label}</h3>
                    </div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      {group.logs.length} {group.logs.length === 1 ? "entry" : "entries"}
                    </p>
                  </div>

                  <div className="divide-y divide-slate-800/80">
                    {group.logs.map((log) => (
                      <div key={log.id} className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <Link
                          href={`/show/${log.tmdb_show_id}/season/${log.season_number}/episode/${log.episode_number}`}
                          className="group flex min-w-0 flex-1 items-start gap-3"
                        >
                          <div className="shrink-0 self-start overflow-hidden rounded-lg bg-slate-800">
                            {log.poster_path ? (
                              <Image
                                src={getPosterUrl(log.poster_path, "w185")}
                                alt={log.show_name ?? "Poster"}
                                width={44}
                                height={66}
                                className="h-[66px] w-[44px] object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                              />
                            ) : (
                              <div className="flex h-[66px] w-[44px] items-center justify-center bg-slate-800 text-slate-500">
                                <Film className="h-4 w-4" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-mono text-[11px] font-semibold text-slate-500">
                              {episodeKey(log.season_number, log.episode_number).replace("E", " E")}
                            </p>
                            <h4 className="mt-1 truncate text-sm font-semibold text-slate-100 transition-colors group-hover:text-blue-300">
                              {log.episode_name || `Episode ${log.episode_number}`}
                            </h4>
                            <p className="mt-1 truncate text-xs text-slate-400">{log.show_name ?? "Unknown show"}</p>
                          </div>
                        </Link>

                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <div className="flex shrink-0 flex-col items-start gap-2 text-left sm:items-end sm:text-right">
                            <p className="text-xs text-slate-500">{log.watched_at ? formatDate(log.watched_at) : "No date"}</p>
                            {log.rating !== null && log.rating !== undefined ? <RatingBadge rating={log.rating} size="sm" /> : <span className="text-xs text-slate-600">Unrated</span>}
                          </div>
                          <DiaryRowActions
                            isDeleting={deletingLogId === log.id}
                            onEdit={() => setEditingLog(log)}
                            onDelete={() => {
                              if (deleteEpisodeLogMutation.isPending) return;
                              const shouldDelete = window.confirm("Delete this watch log?");
                              if (!shouldDelete) return;

                              setDeletingLogId(log.id);
                              deleteEpisodeLogMutation.mutate(log.id);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}

      <EpisodeDiaryModal
        isOpen={!!editingLog}
        episodeLabel={editingLog ? `${episodeKey(editingLog.season_number, editingLog.episode_number)} - ${editingLog.episode_name ?? `Episode ${editingLog.episode_number}`}` : ""}
        title="Edit Watch Log"
        submitLabel="Update"
        defaultWatchedAt={editingLog?.watched_at ?? null}
        defaultRating={editingLog?.rating ?? null}
        isPending={updateEpisodeLogMutation.isPending}
        onSubmit={({ watchedAt, rating }) => {
          if (!editingLog) return;

          updateEpisodeLogMutation.mutate({
            logId: editingLog.id,
            watchedAt,
            rating,
          });
        }}
        onCancel={() => setEditingLog(null)}
      />
    </PageShell>
  );
}
