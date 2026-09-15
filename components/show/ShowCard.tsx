"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { logEpisode } from "@/lib/api";
import { getPosterUrl, formatYear } from "@/lib/utils";
import { EpisodeDiaryModal } from "@/components/show/EpisodeDiaryModal";
import { RatingBadge } from "@/components/ui/RatingBadge";
import type { ShowProgress, TMDBShow, UserShow } from "@/types";

type UserShowCardProps = {
  show: UserShow;
  progress?: ShowProgress;
};

export function UserShowCard({ show, progress }: UserShowCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEpisodeDiaryModalOpen, setIsEpisodeDiaryModalOpen] = useState(false);

  const shouldHideEpisodeInfo = !progress;
  const watchedUniqueCount = progress?.watched_unique_count ?? 0;
  const totalEpisodes = progress?.number_of_episodes ?? show.number_of_episodes;
  const remainingEpisodes = Math.max(totalEpisodes - watchedUniqueCount, 0);
  const nextEpisodeFromProgress = progress?.next_episode ?? null;
  const isCompletedByCount = !!progress && totalEpisodes > 0 && watchedUniqueCount >= totalEpisodes;
  const isCompleted = (show.status === "watched" || isCompletedByCount) && !nextEpisodeFromProgress;
  const shouldSuggestFirstEpisode = !!progress && !nextEpisodeFromProgress && !isCompleted && watchedUniqueCount === 0 && totalEpisodes > 0;
  const nextEpisode =
    nextEpisodeFromProgress ??
    (shouldSuggestFirstEpisode
      ? {
          tmdb_episode_id: null,
          season_number: 1,
          episode_number: 1,
          episode_name: null,
          has_reliable_next: false,
        }
      : null);
  const nextEpisodeLabel = nextEpisode
    ? `S${String(nextEpisode.season_number).padStart(2, "0")} E${String(nextEpisode.episode_number).padStart(2, "0")}`
    : null;
  const nextEpisodeName = nextEpisode?.episode_name ?? null;
  const remainingAfterNextEpisode = Math.max(remainingEpisodes - (nextEpisode ? 1 : 0), 0);
  const primaryStatusLabel = nextEpisodeLabel ?? "Completed";
  const secondaryStatusLabel = nextEpisodeName ?? (isCompleted ? "All episodes watched" : "Start watching");

  const createEpisodeLogMutation = useMutation({
    mutationFn: async ({
      watchedAt,
      rating,
    }: {
      watchedAt: string | null;
      rating: number | null;
    }) => {
      if (!nextEpisode) throw new Error("No next episode available");

      return logEpisode({
        tmdb_show_id: show.tmdb_id,
        tmdb_episode_id: nextEpisode.tmdb_episode_id ?? undefined,
        season_number: nextEpisode.season_number,
        episode_number: nextEpisode.episode_number,
        episode_name: nextEpisode.episode_name ?? undefined,
        watched_at: watchedAt,
        rating: rating ?? undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["episode-logs"] });
      void queryClient.invalidateQueries({ queryKey: ["episode-logs-batch"] });
      void queryClient.invalidateQueries({ queryKey: ["my-shows"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      setIsEpisodeDiaryModalOpen(false);
    },
  });

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/show/${show.tmdb_id}`)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            router.push(`/show/${show.tmdb_id}`);
          }
        }}
        className="flex cursor-pointer items-stretch overflow-hidden rounded-xl bg-slate-800/60 text-left transition-colors active:bg-slate-700/60"
      >
        <Image
          src={getPosterUrl(show.poster_path, "w185")}
          alt={show.name}
          width={68}
          height={104}
          loading="eager"
          className="h-26 w-[4.25rem] shrink-0 bg-slate-700 object-cover"
        />
        <div className="min-w-0 flex-1 p-3">
          <h3 className="truncate text-sm font-semibold text-slate-100">{show.name}</h3>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              {shouldHideEpisodeInfo || (!nextEpisode && !isCompleted) ? (
                <>
                  <p className="truncate text-sm font-semibold text-blue-400">Loading episode...</p>
                  <p className="mt-1 truncate text-xs text-slate-400">Fetching watch progress</p>
                </>
              ) : (
                <>
                  <p className="truncate text-sm font-semibold text-blue-400">
                    {primaryStatusLabel}
                    {nextEpisode ? 
                      remainingAfterNextEpisode > 0 ? 
                        <span className="ml-2 text-xs font-medium text-slate-500">+{remainingAfterNextEpisode}</span> : 
                        <span className="ml-2 text-xs font-medium text-slate-500">Last Episode</span> : 
                      null}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-400">{secondaryStatusLabel}</p>
                </>
              )}
            </div>
            {nextEpisode && !shouldHideEpisodeInfo ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsEpisodeDiaryModalOpen(true);
                }}
                disabled={createEpisodeLogMutation.isPending}
                aria-label={`Mark ${nextEpisodeLabel} as watched`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400 transition-colors active:bg-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <EpisodeDiaryModal
        isOpen={isEpisodeDiaryModalOpen}
        episodeLabel={nextEpisodeLabel && nextEpisodeName ? `${nextEpisodeLabel} - ${nextEpisodeName}` : nextEpisodeLabel ?? ""}
        isPending={createEpisodeLogMutation.isPending}
        onSubmit={(payload) => createEpisodeLogMutation.mutate(payload)}
        onCancel={() => setIsEpisodeDiaryModalOpen(false)}
      />
    </>
  );
}

type SearchShowCardProps = {
  show: TMDBShow;
  onAdd?: (show: TMDBShow) => void;
  isAdded?: boolean;
};

export function SearchShowCard({ show, onAdd, isAdded }: SearchShowCardProps) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/show/${show.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/show/${show.id}`);
        }
      }}
      className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-800/60 p-3 text-left transition-colors active:bg-slate-700/60"
    >
      <Image
        src={getPosterUrl(show.poster_path, "w185")}
        alt={show.name}
        width={56}
        height={80}
        className="h-20 w-14 shrink-0 rounded-lg bg-slate-700 object-cover"
      />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-slate-100">{show.name}</h3>
        <p className="mt-0.5 text-xs text-slate-400">{formatYear(show.first_air_date)}</p>
        {show.vote_average > 0 && (
          <div className="mt-1">
            <RatingBadge rating={show.vote_average} size="sm" />
          </div>
        )}
        {show.overview && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{show.overview}</p>}
      </div>
      {onAdd && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAdd(show);
          }}
          disabled={isAdded}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg transition-colors ${
            isAdded ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400 active:bg-blue-500/40"
          }`}
        >
          {isAdded ? "✓" : "+"}
        </button>
      )}
    </div>
  );
}

type PosterCardProps = {
  show: TMDBShow;
};

export function PosterCard({ show }: PosterCardProps) {
  const router = useRouter();

  return (
    <button type="button" onClick={() => router.push(`/show/${show.id}`)} className="w-28 shrink-0 cursor-pointer text-left">
      <Image
        src={getPosterUrl(show.poster_path, "w185")}
        alt={show.name}
        width={112}
        height={160}
        className="h-40 w-28 rounded-xl bg-slate-700 object-cover"
      />
      <p className="mt-1.5 truncate text-xs font-medium text-slate-300">{show.name}</p>
      {show.vote_average > 0 && <RatingBadge rating={show.vote_average} size="sm" />}
    </button>
  );
}
