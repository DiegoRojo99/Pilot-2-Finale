"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock3, PencilLine, Star, Trash2 } from "lucide-react";
import { getEpisodeLogsForEpisode, getSeasonDetails, getShowDetails, removeEpisodeLogById, updateEpisodeLog } from "@/lib/api";
import { episodeKey, formatDate, getBackdropUrl, getPosterUrl } from "@/lib/utils";
import { PageShell } from "@/components/layout/PageShell";
import { ErrorMessage, PageLoader, RatingBadge } from '@/components/ui';
import { EpisodeDiaryModal } from "@/components/show/EpisodeDiaryModal";
import { EpisodeLog } from "@/types/episode";

function EpisodeWatchLog({
  log,
  classes,
  onEdit,
  onDelete,
  isDeleting,
}: {
  log: EpisodeLog;
  classes?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}) {
  return (
    <div className={`mt-2 rounded-xl border border-slate-700/80 bg-slate-900/60 p-3 text-sm text-slate-300 ${classes}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="flex items-center gap-1">
            <Clock3 className="mr-1 inline h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-100">{log.watched_at ? formatDate(log.watched_at) : "No date"}</span>
          </p>
          <p className="flex items-center gap-1">
            <Star className="mr-1 inline h-3.5 w-3.5 text-amber-400" />
            <span className="text-amber-400">{log.rating !== null && log.rating !== undefined ? `${log.rating}/10` : "Not rated"}</span>
          </p>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex shrink-0 items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200 active:bg-slate-600"
              >
                <PencilLine className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-2.5 py-1.5 text-xs font-medium text-red-300 active:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? "Deleting" : "Delete"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EpisodeWatchLogs({
  logs,
  onEdit,
  onDelete,
  deletingLogId,
}: {
  logs: EpisodeLog[];
  onEdit: (log: EpisodeLog) => void;
  onDelete: (log: EpisodeLog) => void;
  deletingLogId: number | null;
}) {
  const numberOfLogs = logs.length;
  if (numberOfLogs === 0) return <p className="mt-2 text-sm text-slate-500">You have not logged this episode yet.</p>;
  if (numberOfLogs === 1) {
    return (
      <EpisodeWatchLog
        log={logs[0]}
        onEdit={() => onEdit(logs[0])}
        onDelete={() => onDelete(logs[0])}
        isDeleting={deletingLogId === logs[0].id}
      />
    );
  }
  return (
    <div className="mt-2 space-y-1.5 text-sm text-slate-300">
        {logs.map((log) => (
          <EpisodeWatchLog
            key={log.id}
            log={log}
            classes="mt-0"
            onEdit={() => onEdit(log)}
            onDelete={() => onDelete(log)}
            isDeleting={deletingLogId === log.id}
          />
        ))}
    </div>
  );
}

export default function EpisodeDetailPage() {
  const params = useParams<{ id: string; seasonNumber: string; episodeNumber: string }>();
  const showId = Number(params.id);
  const seasonNumber = Number(params.seasonNumber);
  const episodeNumber = Number(params.episodeNumber);
  const queryClient = useQueryClient();
  const hasValidParams = Number.isFinite(showId) && Number.isFinite(seasonNumber) && Number.isFinite(episodeNumber);
  const [editingLog, setEditingLog] = useState<EpisodeLog | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);

  const { data: show, isLoading: isShowLoading, error: showError } = useQuery({
    queryKey: ["show", showId],
    queryFn: () => getShowDetails(showId),
    enabled: hasValidParams,
    staleTime: 30 * 60_000,
  });

  const { data: seasonData, isLoading: isSeasonLoading, error: seasonError } = useQuery({
    queryKey: ["season", showId, seasonNumber],
    queryFn: () => getSeasonDetails(showId, seasonNumber),
    enabled: hasValidParams,
    staleTime: 30 * 60_000,
  });

  const { data: episodeLogs = [] } = useQuery({
    queryKey: ["episode-logs", showId, seasonNumber, episodeNumber],
    queryFn: () => getEpisodeLogsForEpisode(showId, seasonNumber, episodeNumber),
    enabled: hasValidParams,
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
      void queryClient.invalidateQueries({ queryKey: ["episode-logs", showId, seasonNumber, episodeNumber] });
      void queryClient.invalidateQueries({ queryKey: ["episode-logs", showId] });
      void queryClient.invalidateQueries({ queryKey: ["episode-logs"] });
      void queryClient.invalidateQueries({ queryKey: ["episode-logs-batch"] });
      void queryClient.invalidateQueries({ queryKey: ["my-shows"] });
      void queryClient.invalidateQueries({ queryKey: ["my-show", showId] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      setEditingLog(null);
    },
  });

  const deleteEpisodeLogMutation = useMutation({
    mutationFn: async (logId: number) => removeEpisodeLogById(logId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["episode-logs", showId, seasonNumber, episodeNumber] });
      void queryClient.invalidateQueries({ queryKey: ["episode-logs", showId] });
      void queryClient.invalidateQueries({ queryKey: ["episode-logs"] });
      void queryClient.invalidateQueries({ queryKey: ["episode-logs-batch"] });
      void queryClient.invalidateQueries({ queryKey: ["my-shows"] });
      void queryClient.invalidateQueries({ queryKey: ["my-show", showId] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onSettled: () => setDeletingLogId(null),
  });

  const episode = useMemo(
    () => seasonData?.episodes?.find((item) => item.episode_number === episodeNumber),
    [seasonData, episodeNumber],
  );

  const watchLogs = useMemo(() => episodeLogs, [episodeLogs]);

  if (!hasValidParams) {
    return (
      <PageShell showBack>
        <ErrorMessage message="Invalid episode URL" />
      </PageShell>
    );
  }

  if (isShowLoading || isSeasonLoading) {
    return (
      <PageShell showBack>
        <PageLoader />
      </PageShell>
    );
  }

  if (showError || seasonError || !show || !seasonData || !episode) {
    return (
      <PageShell showBack>
        <ErrorMessage message="Failed to load episode details" />
      </PageShell>
    );
  }

  return (
    <PageShell showBack noPadding>
      <div className="relative">
        {episode.still_path || show.backdrop_path ? (
          <div className="relative h-52 overflow-hidden">
            <Image
              src={episode.still_path ? getBackdropUrl(episode.still_path, "w780") : getBackdropUrl(show.backdrop_path, "w780")}
              alt={episode.name}
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-slate-900/35 to-slate-900" />
          </div>
        ) : (
          <div className="h-16" />
        )}

        <div className="relative -mt-12 px-4 pb-4">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-xl backdrop-blur">
            <div className="flex items-start gap-3">
              <Image
                src={getPosterUrl(show.poster_path, "w185")}
                alt={show.name}
                width={54}
                height={78}
                className="h-20 w-14 shrink-0 rounded-lg bg-slate-700 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">{episodeKey(seasonNumber, episodeNumber)}</p>
                <h1 className="mt-1 text-lg font-semibold leading-tight text-slate-100">{episode.name}</h1>
                <Link href={`/show/${showId}`} className="mt-1 block truncate text-sm text-slate-400 transition-colors hover:text-slate-200">
                  {show.name}
                </Link>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              {episode.air_date ? (
                <span className="inline-flex items-center gap-1.5 text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(episode.air_date)}
                </span>
              ) : null}
              {episode.runtime ? (
                <span className="inline-flex items-center gap-1.5 text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  {episode.runtime} min
                </span>
              ) : null}
              {episode.vote_average > 0 ? <RatingBadge rating={episode.vote_average} size="sm" /> : null}
            </div>

            {episode.overview ? (
              <p className="mt-4 text-sm leading-relaxed text-slate-300">{episode.overview}</p>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No overview available for this episode.</p>
            )}

            <div className="mt-5 rounded-xl border border-slate-700 bg-slate-800/70 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Your Watch Log</p>
              <EpisodeWatchLogs
                logs={watchLogs}
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
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <Link
                href={`/show/${showId}`}
                className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-600"
              >
                Back to show
              </Link>
            </div>
          </div>
        </div>
      </div>

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
