"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Check, ChevronDown, ChevronUp, Plus, Star, Trash2 } from "lucide-react";
import {
  addShow,
  getMyShow,
  getSeasonDetails,
  getShowDetails,
  getShowEpisodeLogs,
  logEpisode,
  logEpisodesBulk,
  removeShow,
  syncShowEpisodeCatalogBatch,
  updateShowStatus,
} from "@/lib/api";
import { episodeKey, formatDate, getBackdropUrl, getPosterUrl } from "@/lib/utils";
import { PageShell } from "@/components/layout/PageShell";
import { EpisodeDiaryModal } from "@/components/show/EpisodeDiaryModal";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner, PageLoader } from "@/components/ui/LoadingSpinner";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { STATUS_LABELS, type EpisodeLog, type ShowStatus, type TMDBEpisode, type TMDBSeason } from "@/types";

const ALL_STATUSES: ShowStatus[] = ["watching", "want_to_watch", "watched", "on_hold", "dropped"];

function MarkAllConfirmDialog({
  isOpen,
  episodeNumber,
  count,
  isPending,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  episodeNumber: number;
  count: number;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="rounded-xl bg-slate-800 p-6 shadow-xl max-w-sm">
        <h3 className="text-lg font-semibold text-slate-100">Mark Previous Episodes?</h3>
        <p className="mt-2 text-sm text-slate-400">
          You&apos;re marking episode {episodeNumber} as watched. Would you also like to mark the {count} earlier {count === 1 ? "episode" : "episodes"} as watched?
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 active:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Adding…" : "Mark All"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusPicker({
  current,
  disabled,
  onChange,
  onRemove,
}: {
  current: ShowStatus | null;
  disabled?: boolean;
  onChange: (status: ShowStatus) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-xl bg-slate-700 px-3 py-2 text-sm font-medium text-slate-200 active:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {current ? STATUS_LABELS[current] : "Add to List"}
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute top-full right-0 z-20 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-xl">
          {ALL_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                onChange(status);
                setOpen(false);
              }}
              className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                current === status ? "bg-blue-400/10 text-blue-400" : "text-slate-300 active:bg-slate-700"
              }`}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
          {current && (
            <>
              <div className="border-t border-slate-700" />
              <button
                type="button"
                onClick={() => {
                  onRemove();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-400 active:bg-slate-700"
              >
                <Trash2 className="h-4 w-4" />
                Remove from list
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EpisodeRow({
  showId,
  episode,
  isWatched,
  disabled,
  onToggle,
}: {
  showId: number;
  episode: TMDBEpisode;
  isWatched: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800/60 last:border-0 py-1">
      {episode.still_path ? (
        <Image
          src={getBackdropUrl(episode.still_path)}
          alt={episode.name}
          width={64}
          height={48}
          className="h-12 w-16 shrink-0 rounded-lg bg-slate-700 object-cover"
        />
      ) : (
        <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-[11px] uppercase tracking-[0.18em] text-slate-500">
          No image
        </div>
      )}
      <div className="min-w-0 flex-1 py-2">
        <div className="flex items-center gap-2">
          <span className="shrink-0 font-mono text-xs text-slate-500">
            {String(episode.episode_number).padStart(2, "0")}
          </span>
          <Link
            href={`/show/${showId}/season/${episode.season_number}/episode/${episode.episode_number}`}
            className={`truncate text-sm transition-colors active:text-blue-300 ${isWatched ? "text-slate-400 hover:text-slate-200" : "text-slate-200 hover:text-blue-300"}`}
          >
            {episode.name}
          </Link>
        </div>
        <div className="mt-0.5 ml-6 flex items-center gap-2">
          {episode.air_date && (
            <span className="flex items-center gap-1 text-xs text-slate-600">
              <Calendar className="h-3 w-3" />
              {formatDate(episode.air_date)}
            </span>
          )}
          {episode.vote_average > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-500">
              <Star className="h-3 w-3 fill-current" />
              {episode.vote_average.toFixed(1)}
            </span>
          )}
          {episode.runtime ? <span className="text-xs text-slate-600">{episode.runtime}m</span> : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          isWatched ? "border-green-500 bg-green-500 text-white" : "border-slate-600 text-transparent active:border-slate-400"
        }`}
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}

function SeasonAccordion({
  showId,
  seasonNumber,
  episodeCount,
  watchedCount,
  seasonName,
  watchedSet,
  disabled,
  onMarkSeasonAll,
  onToggleEpisode,
}: {
  showId: number;
  seasonNumber: number;
  episodeCount: number;
  watchedCount: number;
  seasonName: string;
  watchedSet: Set<string>;
  disabled?: boolean;
  onMarkSeasonAll: (season: number) => void;
  onToggleEpisode: (season: number, episode: number, name: string, tmdbEpisodeId?: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const { data: seasonData, isLoading } = useQuery({
    queryKey: ["season", showId, seasonNumber],
    queryFn: () => getSeasonDetails(showId, seasonNumber),
    enabled: expanded,
    staleTime: 30 * 60_000,
  });

  const loadedWatchedCount =
    seasonData?.episodes?.filter((episode) => watchedSet.has(episodeKey(episode.season_number, episode.episode_number)))
      .length;
  const effectiveWatchedCount = loadedWatchedCount ?? watchedCount;
  const remainingCount = Math.max(episodeCount - effectiveWatchedCount, 0);

  return (
    <div className="mb-2 overflow-hidden rounded-xl bg-slate-800/50">
      <div className="flex items-center gap-2 p-4">
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          className="flex min-w-0 flex-1 items-center justify-between text-left disabled:cursor-not-allowed disabled:opacity-70"
          onClick={() => setExpanded((value) => !value)}
          onKeyDown={(event) => {
            if (disabled) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setExpanded((value) => !value);
            }
          }}
          aria-disabled={disabled}
        >
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-semibold text-slate-200">{seasonName}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {effectiveWatchedCount}/{episodeCount} episodes
            </p>
          </div>
          <div className="flex items-center gap-2">
            {remainingCount > 0 && (
              <button
                type="button"
                disabled={disabled}
                onClick={(event) => {
                  event.stopPropagation();
                  onMarkSeasonAll(seasonNumber);
                }}
                title={`Mark all ${remainingCount} remaining episodes in this season`}
                aria-label={`Mark all ${remainingCount} remaining episodes in this season`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-slate-600 text-transparent transition-colors active:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="h-4 w-4" />
              </button>
            )}

            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${episodeCount > 0 ? (effectiveWatchedCount / episodeCount) * 100 : 0}%` }}
              />
            </div>

            {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-3">
          {isLoading && <div className="py-4 text-center text-sm text-slate-500">Loading episodes…</div>}

          {seasonData?.episodes?.map((episode) => (
            <EpisodeRow
              key={episode.id}
              showId={showId}
              episode={episode}
              disabled={disabled}
              isWatched={watchedSet.has(episodeKey(episode.season_number, episode.episode_number))}
              onToggle={() =>
                onToggleEpisode(
                  episode.season_number,
                  episode.episode_number,
                  episode.name,
                  episode.id,
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ShowDetailPage() {
  const params = useParams<{ id: string }>();
  const showId = Number(params.id);
  const queryClient = useQueryClient();

  const [markAllConfirm, setMarkAllConfirm] = useState<{
    season: number;
    episode: number;
    tmdbEpisodeId?: number;
    episodeName: string;
    unwatchedCount: number;
  } | null>(null);
  const [isEpisodeDiaryModalOpen, setIsEpisodeDiaryModalOpen] = useState(false);
  const [selectedEpisodeForDiary, setSelectedEpisodeForDiary] = useState<{
    seasonNumber: number;
    episodeNumber: number;
    episodeName: string;
    tmdbEpisodeId?: number;
  } | null>(null);
  const [seasonDataCache, setSeasonDataCache] = useState<
    Map<string, TMDBSeason>
  >(new Map());

  const { data: show, isLoading: showLoading, error: showError } = useQuery({
    queryKey: ["show", showId],
    queryFn: () => getShowDetails(showId),
    enabled: Number.isFinite(showId),
    staleTime: 30 * 60_000,
  });

  const { data: userShow, isLoading: userShowLoading } = useQuery({
    queryKey: ["my-show", showId],
    queryFn: () => getMyShow(showId),
    enabled: Number.isFinite(showId),
    staleTime: 30_000,
  });

  const { data: episodeLogs = [], isLoading: episodeLogsLoading } = useQuery({
    queryKey: ["episode-logs", showId],
    queryFn: () => getShowEpisodeLogs(showId),
    enabled: Number.isFinite(showId),
    staleTime: 30_000,
  });

  useQuery({
    queryKey: ["catalog-sync-on-open", showId, userShow?.id],
    queryFn: async () => {
      await syncShowEpisodeCatalogBatch([showId]);
      await queryClient.invalidateQueries({ queryKey: ["my-show", showId] });
      await queryClient.invalidateQueries({ queryKey: ["my-shows"] });
      await queryClient.invalidateQueries({ queryKey: ["episode-logs-batch"] });
      return true;
    },
    enabled: Number.isFinite(showId) && Boolean(userShow),
    staleTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const watchedSet = useMemo(() => {
    const set = new Set<string>();
    episodeLogs.forEach((log: EpisodeLog) => set.add(episodeKey(log.season_number, log.episode_number)));
    return set;
  }, [episodeLogs]);

  const watchedCountBySeason = useMemo(() => {
    const counts = new Map<number, number>();
    episodeLogs.forEach((log: EpisodeLog) => {
      const current = counts.get(log.season_number) ?? 0;
      counts.set(log.season_number, current + 1);
    });
    return counts;
  }, [episodeLogs]);

  const getCachedSeasonDetails = async (seasonNumber: number) => {
    const cacheKey = `${showId}-${seasonNumber}`;
    const cachedSeason = seasonDataCache.get(cacheKey);
    if (cachedSeason) return cachedSeason;

    const seasonData = await getSeasonDetails(showId, seasonNumber);
    setSeasonDataCache((prev) => new Map(prev).set(cacheKey, seasonData));
    return seasonData;
  };

  const statusMutation = useMutation({
    mutationFn: async (status: ShowStatus) => {
      if (!show) return null;
      const savedShow = userShow
        ? await updateShowStatus(showId, status)
        : await addShow({
        tmdb_id: show.id,
        name: show.name,
        poster_path: show.poster_path,
        backdrop_path: show.backdrop_path,
        overview: show.overview,
        first_air_date: show.first_air_date,
        vote_average: show.vote_average,
        number_of_seasons: show.number_of_seasons,
        number_of_episodes: show.number_of_episodes,
        status,
      });

      if (status === "watched" && visibleSeasons.length > 0) {
        const seasonDetails = await Promise.all(
          visibleSeasons.map(async (season) => ({
            seasonNumber: season.season_number,
            seasonData: await getCachedSeasonDetails(season.season_number),
          })),
        );

        const episodesToLog = seasonDetails.flatMap(({ seasonNumber, seasonData }) =>
          (seasonData.episodes ?? [])
            .filter((episode) => !watchedSet.has(episodeKey(episode.season_number, episode.episode_number)))
            .map((episode) => ({
              tmdb_episode_id: episode.id,
              season_number: seasonNumber,
              episode_number: episode.episode_number,
              episode_name: episode.name,
              watched_at: null,
            })),
        );

        if (episodesToLog.length > 0) {
          await logEpisodesBulk({
            tmdb_show_id: showId,
            episodes: episodesToLog,
          });
        }
      }

      return savedShow;
    },
    onSuccess: (_, status) => {
      void queryClient.invalidateQueries({ queryKey: ["my-show", showId] });
      void queryClient.invalidateQueries({ queryKey: ["my-shows"] });

      if (status === "watched") {
        void queryClient.invalidateQueries({ queryKey: ["episode-logs", showId] });
        void queryClient.invalidateQueries({ queryKey: ["episode-logs"] });
        void queryClient.invalidateQueries({ queryKey: ["stats"] });
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeShow(showId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-show", showId] });
      void queryClient.invalidateQueries({ queryKey: ["my-shows"] });
    },
  });

  const createEpisodeLogMutation = useMutation({
    mutationFn: async ({
      season,
      episode,
      name,
      tmdbEpisodeId,
      watchedAt,
      rating,
    }: {
      season: number;
      episode: number;
      name: string;
      tmdbEpisodeId?: number;
      watchedAt: string | null;
      rating: number | null;
    }) => {
      return logEpisode({
        tmdb_show_id: showId,
        tmdb_episode_id: tmdbEpisodeId,
        season_number: season,
        episode_number: episode,
        episode_name: name,
        watched_at: watchedAt,
        rating: rating ?? undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["episode-logs", showId] });
      void queryClient.invalidateQueries({ queryKey: ["episode-logs"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const bulkLogEpisodesMutation = useMutation({
    mutationFn: async ({
      season,
      episodes,
    }: {
      season: number;
      episodes: Array<{ episode: number; name: string; tmdbEpisodeId?: number }>;
    }) =>
      logEpisodesBulk({
        tmdb_show_id: showId,
        episodes: episodes.map((item) => ({
          tmdb_episode_id: item.tmdbEpisodeId,
          season_number: season,
          episode_number: item.episode,
          episode_name: item.name,
          watched_at: null,
        })),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["episode-logs", showId] });
      void queryClient.invalidateQueries({ queryKey: ["episode-logs"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const markAllSeasonEpisodes = async (seasonNumber: number) => {
    if (isBulkAddingEpisodes || isCreatingEpisodeLog || isStatusUpdating) return;
    let seasonData: TMDBSeason;

    try { seasonData = await getCachedSeasonDetails(seasonNumber); } 
    catch { return; }
    if (!seasonData?.episodes?.length) return;

    const episodesToLog = seasonData.episodes
      .filter((episode) => !watchedSet.has(episodeKey(episode.season_number, episode.episode_number)))
      .map((episode) => ({
        episode: episode.episode_number,
        name: episode.name,
        tmdbEpisodeId: episode.id,
      }));

    if (episodesToLog.length === 0) return;
    bulkLogEpisodesMutation.mutate({
      season: seasonNumber,
      episodes: episodesToLog,
    });
  };

  const handleToggleEpisode = async (
    seasonNumber: number,
    episodeNumber: number,
    name: string,
    tmdbEpisodeId?: number
  ) => {
    if (isBulkAddingEpisodes || isCreatingEpisodeLog || isStatusUpdating) return;

    // Before opening the single-entry modal, offer a shortcut for filling prior unwatched episodes.
    let seasonData: TMDBSeason;

    try {
      seasonData = await getCachedSeasonDetails(seasonNumber);
    } 
    catch {
      setSelectedEpisodeForDiary({
        seasonNumber,
        episodeNumber,
        episodeName: name,
        tmdbEpisodeId,
      });
      setIsEpisodeDiaryModalOpen(true);
      return;
    }

    if (!seasonData) return;
    const episodes = seasonData.episodes || [];
    const unwatchedBefore = episodes.filter(
      (ep) =>
        ep.episode_number < episodeNumber &&
        !watchedSet.has(episodeKey(ep.season_number, ep.episode_number))
    );

    if (unwatchedBefore.length > 0) {
      setMarkAllConfirm({
        season: seasonNumber,
        episode: episodeNumber,
        tmdbEpisodeId,
        episodeName: name,
        unwatchedCount: unwatchedBefore.length,
      });
    } else {
      setSelectedEpisodeForDiary({
        seasonNumber,
        episodeNumber,
        episodeName: name,
        tmdbEpisodeId,
      });
      setIsEpisodeDiaryModalOpen(true);
    }
  };

  const isBulkAddingEpisodes = bulkLogEpisodesMutation.isPending;
  const isCreatingEpisodeLog = createEpisodeLogMutation.isPending;
  const isStatusUpdating = statusMutation.isPending || removeMutation.isPending;
  const isEpisodeProgressReady = !userShowLoading && (!userShow || !episodeLogsLoading);

  if (!Number.isFinite(showId)) {
    return (
      <PageShell showBack>
        <ErrorMessage message="Invalid show ID" />
      </PageShell>
    );
  }

  if (showLoading) {
    return (
      <PageShell showBack>
        <PageLoader />
      </PageShell>
    );
  }

  if (showError || !show) {
    return (
      <PageShell showBack>
        <ErrorMessage message="Failed to load show details" />
      </PageShell>
    );
  }

  const visibleSeasons = (show.seasons ?? []).filter((season) => season.season_number > 0);

  return (
    <PageShell showBack noPadding>
      <div className="relative">
        {show.backdrop_path ? (
          <div className="relative h-48 overflow-hidden">
            <Image src={getBackdropUrl(show.backdrop_path)} alt="" fill className="object-cover" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
          </div>
        ) : (
          <div className="h-20" />
        )}

        <div className="relative -mt-16 flex gap-4 px-4">
          <Image
            src={getPosterUrl(show.poster_path, "w342")}
            alt={show.name}
            width={96}
            height={144}
            className="h-36 w-24 shrink-0 rounded-xl bg-slate-700 object-cover shadow-xl"
          />
          <div className="min-w-0 flex-1 pt-20">
            <h1 className="text-lg font-bold leading-tight text-slate-100">{show.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {show.first_air_date && <span className="text-xs text-slate-400">{new Date(show.first_air_date).getFullYear()}</span>}
              {show.vote_average > 0 && <RatingBadge rating={show.vote_average} size="sm" />}
              {userShow && <StatusBadge status={userShow.status} size="sm" />}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {show.number_of_seasons ? <span>{show.number_of_seasons} season{show.number_of_seasons !== 1 ? "s" : ""}</span> : null}
            {show.number_of_episodes ? <span>· {show.number_of_episodes} eps</span> : null}
          </div>
          <StatusPicker
            current={userShow?.status ?? null}
            disabled={isBulkAddingEpisodes || isCreatingEpisodeLog || isStatusUpdating}
            onChange={(status) => statusMutation.mutate(status)}
            onRemove={() => removeMutation.mutate()}
          />
        </div>

        {show.genres && show.genres.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
            {show.genres.map((genre) => (
              <span key={genre.id} className="shrink-0 rounded-full bg-slate-700/60 px-2.5 py-1 text-xs text-slate-300">
                {genre.name}
              </span>
            ))}
          </div>
        )}

        {show.overview && (
          <div className="mt-3 px-4">
            <p className="text-sm leading-relaxed text-slate-400">{show.overview}</p>
          </div>
        )}

        {show.networks && show.networks.length > 0 && (
          <div className="mt-2 px-4">
            <p className="text-xs text-slate-500">{show.networks.map((network) => network.name).join(", ")}</p>
          </div>
        )}

        {visibleSeasons.length > 0 && (
          <div className="mt-5 px-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Plus className="h-4 w-4 text-blue-400" />
              Track Episodes
            </h2>
            {!isEpisodeProgressReady ? (
              <div className="mb-3 rounded-xl bg-slate-800/50 p-4 text-xs text-slate-500">Loading your episode progress...</div>
            ) : (
              <>
                {!userShow ? <p className="mb-3 text-xs text-slate-500">Add this show to your list to mark episodes as watched.</p> : null}
                {visibleSeasons.map((season) => (
                  <SeasonAccordion
                    key={season.season_number}
                    showId={showId}
                    seasonNumber={season.season_number}
                    episodeCount={season.episode_count}
                    watchedCount={watchedCountBySeason.get(season.season_number) ?? 0}
                    seasonName={season.name}
                    watchedSet={watchedSet}
                    disabled={!userShow || isBulkAddingEpisodes || isCreatingEpisodeLog || isStatusUpdating}
                    onMarkSeasonAll={markAllSeasonEpisodes}
                    onToggleEpisode={handleToggleEpisode}
                  />
                ))}
              </>
            )}
          </div>
        )}

        <MarkAllConfirmDialog
          isOpen={!!markAllConfirm}
          episodeNumber={markAllConfirm?.episode ?? 0}
          count={markAllConfirm?.unwatchedCount ?? 0}
          isPending={isBulkAddingEpisodes}
          onConfirm={async () => {
            if (!markAllConfirm) return;

            const cacheKey = `${showId}-${markAllConfirm.season}`;
            const seasonData = seasonDataCache.get(cacheKey);
            const episodes = seasonData?.episodes || [];

            const unwatchedBefore = episodes.filter(
              (ep) =>
                ep.episode_number < markAllConfirm.episode &&
                !watchedSet.has(episodeKey(ep.season_number, ep.episode_number))
            );

            setMarkAllConfirm(null);

            const episodesToLog = [
              { episode: markAllConfirm.episode, name: markAllConfirm.episodeName, tmdbEpisodeId: markAllConfirm.tmdbEpisodeId },
              ...unwatchedBefore.map((ep) => ({ episode: ep.episode_number, name: ep.name, tmdbEpisodeId: ep.id })),
            ];

            bulkLogEpisodesMutation.mutate({
              season: markAllConfirm.season,
              episodes: episodesToLog,
            });
          }}
          onCancel={() => {
            if (!markAllConfirm) return;

            setSelectedEpisodeForDiary({
              seasonNumber: markAllConfirm.season,
              episodeNumber: markAllConfirm.episode,
              episodeName: markAllConfirm.episodeName,
              tmdbEpisodeId: markAllConfirm.tmdbEpisodeId,
            });
            setIsEpisodeDiaryModalOpen(true);

            setMarkAllConfirm(null);
          }}
        />

        <EpisodeDiaryModal
          isOpen={isEpisodeDiaryModalOpen}
          episodeLabel={
            selectedEpisodeForDiary
              ? `S${String(selectedEpisodeForDiary.seasonNumber).padStart(2, "0")}E${String(
                  selectedEpisodeForDiary.episodeNumber,
                ).padStart(2, "0")} - ${selectedEpisodeForDiary.episodeName}`
              : ""
          }
          isPending={isCreatingEpisodeLog}
          onSubmit={(payload) => {
            if (!selectedEpisodeForDiary) return;

            createEpisodeLogMutation.mutate(
              {
                season: selectedEpisodeForDiary.seasonNumber,
                episode: selectedEpisodeForDiary.episodeNumber,
                name: selectedEpisodeForDiary.episodeName,
                tmdbEpisodeId: selectedEpisodeForDiary.tmdbEpisodeId,
                watchedAt: payload.watchedAt,
                rating: payload.rating,
              },
              {
                onSuccess: () => {
                  setIsEpisodeDiaryModalOpen(false);
                  setSelectedEpisodeForDiary(null);
                },
              },
            );
          }}
          onCancel={() => {
            setIsEpisodeDiaryModalOpen(false);
            setSelectedEpisodeForDiary(null);
          }}
        />

        {isBulkAddingEpisodes && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 backdrop-blur-[2px]">
            <div className="rounded-2xl border border-slate-700 bg-slate-900 px-6 py-5 text-center shadow-2xl">
              <LoadingSpinner size="md" className="mb-3" />
              <p className="text-sm font-medium text-slate-100">Adding episodes...</p>
              <p className="mt-1 text-xs text-slate-400">Please wait until the update finishes.</p>
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>
    </PageShell>
  );
}
