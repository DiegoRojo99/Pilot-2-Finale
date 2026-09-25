"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckSquare } from "lucide-react";
import { getEpisodeLogs, removeEpisodeLogById, updateEpisodeLog } from "@/lib/api";
import { episodeKey, formatDate } from "@/lib/utils";
import { PageShell } from "@/components/layout/PageShell";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { EpisodeDiaryModal } from "@/components/show/EpisodeDiaryModal";
import DiaryDayEntry from "@/components/diary/DiaryDayEntry";
import type { EpisodeLog } from "@/types";

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
        <>
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
                <DiaryDayEntry
                  key={group.groupKey}
                  group={group}
                  deletingLogId={deletingLogId}
                  onEdit={(log) => setEditingLog(log)}
                  onDelete={(log) => {
                    if (deleteEpisodeLogMutation.isPending) return;
                    const shouldDelete = window.confirm("Delete this watch log?");
                    if (!shouldDelete) return;

                    setDeletingLogId(log.id);
                    deleteEpisodeLogMutation.mutate(log.id);
                  }}
                />
              ))}
            </div>
          )}
        </>
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
