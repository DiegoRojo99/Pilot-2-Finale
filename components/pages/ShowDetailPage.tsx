"use client";

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
  removeEpisodeLog,
  removeShow,
  updateShowStatus,
} from "@/lib/api";
import { episodeKey, formatDate, getBackdropUrl, getPosterUrl } from "@/lib/utils";
import { PageShell } from "@/components/layout/PageShell";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { STATUS_LABELS, type EpisodeLog, type ShowStatus, type TMDBEpisode, type TMDBSeason } from "@/types";

const ALL_STATUSES: ShowStatus[] = ["watching", "want_to_watch", "watched", "on_hold", "dropped"];

function MarkAllConfirmDialog({
  isOpen,
  episodeNumber,
  count,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  episodeNumber: number;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="rounded-xl bg-slate-800 p-6 shadow-xl max-w-sm">
        <h3 className="text-lg font-semibold text-slate-100">Mark Previous Episodes?</h3>
        <p className="mt-2 text-sm text-slate-400">
          You're marking episode {episodeNumber} as watched. Would you also like to mark the {count} earlier {count === 1 ? "episode" : "episodes"} as watched?
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 active:bg-slate-600"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white active:bg-blue-700"
          >
            Mark All
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusPicker({
  current,
  onChange,
  onRemove,
}: {
  current: ShowStatus | null;
  onChange: (status: ShowStatus) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 rounded-xl bg-slate-700 px-3 py-2 text-sm font-medium text-slate-200 active:bg-slate-600"
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
  episode,
  isWatched,
  onToggle,
}: {
  episode: TMDBEpisode;
  isWatched: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800/60 py-2.5 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          isWatched ? "border-green-500 bg-green-500 text-white" : "border-slate-600 text-transparent active:border-slate-400"
        }`}
      >
        <Check className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="shrink-0 font-mono text-xs text-slate-500">
            {String(episode.episode_number).padStart(2, "0")}
          </span>
          <span className={`truncate text-sm ${isWatched ? "text-slate-400" : "text-slate-200"}`}>
            {episode.name}
          </span>
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
    </div>
  );
}

function SeasonAccordion({
  showId,
  seasonNumber,
  episodeCount,
  seasonName,
  watchedSet,
  onToggleEpisode,
}: {
  showId: number;
  seasonNumber: number;
  episodeCount: number;
  seasonName: string;
  watchedSet: Set<string>;
  onToggleEpisode: (season: number, episode: number, name: string, watched: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const { data: seasonData, isLoading } = useQuery({
    queryKey: ["season", showId, seasonNumber],
    queryFn: () => getSeasonDetails(showId, seasonNumber),
    enabled: expanded,
    staleTime: 30 * 60_000,
  });

  const watchedCount =
    seasonData?.episodes?.filter((episode) => watchedSet.has(episodeKey(episode.season_number, episode.episode_number)))
      .length ?? 0;

  return (
    <div className="mb-2 overflow-hidden rounded-xl bg-slate-800/50">
      <button
        type="button"
        className="flex w-full items-center justify-between p-4"
        onClick={() => setExpanded((value) => !value)}
      >
        <div className="text-left">
          <p className="text-sm font-semibold text-slate-200">{seasonName}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {watchedCount}/{episodeCount} episodes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${episodeCount > 0 ? (watchedCount / episodeCount) * 100 : 0}%` }}
            />
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-3">
          {isLoading && <div className="py-4 text-center text-sm text-slate-500">Loading episodes…</div>}
          {seasonData?.episodes?.map((episode) => (
            <EpisodeRow
              key={episode.id}
              episode={episode}
              isWatched={watchedSet.has(episodeKey(episode.season_number, episode.episode_number))}
              onToggle={() =>
                onToggleEpisode(
                  episode.season_number,
                  episode.episode_number,
                  episode.name,
                  watchedSet.has(episodeKey(episode.season_number, episode.episode_number)),
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
    episodeName: string;
    unwatchedCount: number;
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

  const { data: userShow } = useQuery({
    queryKey: ["my-show", showId],
    queryFn: () => getMyShow(showId),
    enabled: Number.isFinite(showId),
    staleTime: 30_000,
  });

  const { data: episodeLogs = [] } = useQuery({
    queryKey: ["episode-logs", showId],
    queryFn: () => getShowEpisodeLogs(showId),
    enabled: Number.isFinite(showId),
    staleTime: 30_000,
  });

  const watchedSet = useMemo(() => {
    const set = new Set<string>();
    episodeLogs.forEach((log: EpisodeLog) => set.add(episodeKey(log.season_number, log.episode_number)));
    return set;
  }, [episodeLogs]);

  const statusMutation = useMutation({
    mutationFn: async (status: ShowStatus) => {
      if (!show) {
        return null;
      }

      if (userShow) {
        return updateShowStatus(showId, status);
      }

      return addShow({
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
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-show", showId] });
      void queryClient.invalidateQueries({ queryKey: ["my-shows"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeShow(showId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-show", showId] });
      void queryClient.invalidateQueries({ queryKey: ["my-shows"] });
    },
  });

  const toggleEpisodeMutation = useMutation({
    mutationFn: async ({
      season,
      episode,
      name,
      watched,
    }: {
      season: number;
      episode: number;
      name: string;
      watched: boolean;
    }) => {
      if (watched) {
        return removeEpisodeLog(showId, season, episode);
      }

      return logEpisode({
        tmdb_show_id: showId,
        season_number: season,
        episode_number: episode,
        episode_name: name,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["episode-logs", showId] });
      void queryClient.invalidateQueries({ queryKey: ["episode-logs"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

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
            <img src={getBackdropUrl(show.backdrop_path)} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
          </div>
        ) : (
          <div className="h-20" />
        )}

        <div className="relative -mt-16 flex gap-4 px-4">
          <img
            src={getPosterUrl(show.poster_path, "w342")}
            alt={show.name}
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

        {userShow && visibleSeasons.length > 0 && (
          <div className="mt-5 px-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Plus className="h-4 w-4 text-blue-400" />
              Track Episodes
            </h2>
            {visibleSeasons.map((season) => (
              <SeasonAccordion
                key={season.season_number}
                showId={showId}
                seasonNumber={season.season_number}
                episodeCount={season.episode_count}
                seasonName={season.name}
                watchedSet={watchedSet}
                onToggleEpisode={async (seasonNumber, episodeNumber, name, watched) => {
                  // If unmarking, just remove it
                  if (watched) {
                    toggleEpisodeMutation.mutate({
                      season: seasonNumber,
                      episode: episodeNumber,
                      name,
                      watched,
                    });
                    return;
                  }

                  // If marking as watched, check for unwatched earlier episodes
                  const cacheKey = `${showId}-${seasonNumber}`;
                  let seasonData = seasonDataCache.get(cacheKey);

                  if (!seasonData) {
                    try {
                      seasonData = await getSeasonDetails(showId, seasonNumber);
                      setSeasonDataCache((prev) => new Map(prev).set(cacheKey, seasonData!));
                    } catch {
                      // If we can't get season data, just mark it
                      toggleEpisodeMutation.mutate({
                        season: seasonNumber,
                        episode: episodeNumber,
                        name,
                        watched,
                      });
                      return;
                    }
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
                      episodeName: name,
                      unwatchedCount: unwatchedBefore.length,
                    });
                  } else {
                    toggleEpisodeMutation.mutate({
                      season: seasonNumber,
                      episode: episodeNumber,
                      name,
                      watched,
                    });
                  }
                }}
              />
            ))}
          </div>
        )}

        {!userShow && show.number_of_seasons && show.number_of_seasons > 0 && (
          <div className="mx-4 mt-4 rounded-xl bg-slate-800/40 py-4 text-center">
            <p className="text-sm text-slate-400">Add this show to your list to track episodes</p>
          </div>
        )}

        <MarkAllConfirmDialog
          isOpen={!!markAllConfirm}
          episodeNumber={markAllConfirm?.episode ?? 0}
          count={markAllConfirm?.unwatchedCount ?? 0}
          onConfirm={async () => {
            if (!markAllConfirm) return;

            const cacheKey = `${showId}-${markAllConfirm.season}`;
            const seasonData = seasonDataCache.get(cacheKey);
            const episodes = seasonData?.episodes || [];

            // Mark the current episode first
            toggleEpisodeMutation.mutate({
              season: markAllConfirm.season,
              episode: markAllConfirm.episode,
              name: markAllConfirm.episodeName,
              watched: false,
            });

            // Then mark all earlier unwatched episodes
            const unwatchedBefore = episodes.filter(
              (ep) =>
                ep.episode_number < markAllConfirm.episode &&
                !watchedSet.has(episodeKey(ep.season_number, ep.episode_number))
            );

            for (const ep of unwatchedBefore) {
              toggleEpisodeMutation.mutate({
                season: ep.season_number,
                episode: ep.episode_number,
                name: ep.name,
                watched: false,
              });
            }

            setMarkAllConfirm(null);
          }}
          onCancel={() => {
            if (!markAllConfirm) return;

            // Just mark the selected episode without marking previous ones
            toggleEpisodeMutation.mutate({
              season: markAllConfirm.season,
              episode: markAllConfirm.episode,
              name: markAllConfirm.episodeName,
              watched: false,
            });

            setMarkAllConfirm(null);
          }}
        />

        <div className="h-6" />
      </div>
    </PageShell>
  );
}
