"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { logEpisode, getSeasonDetails, getShowDetails, getShowEpisodeLogs } from "@/lib/api";
import { getPosterUrl, episodeKey, formatYear } from "@/lib/utils";
import { EpisodeDiaryModal } from "@/components/show/EpisodeDiaryModal";
import { RatingBadge } from "@/components/ui/RatingBadge";
import type { TMDBShow, UserShow } from "@/types";

type UserShowCardProps = {
  show: UserShow;
};

export function UserShowCard({ show }: UserShowCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEpisodeDiaryModalOpen, setIsEpisodeDiaryModalOpen] = useState(false);

  const { data: episodeLogs = [] } = useQuery({
    queryKey: ["episode-logs", show.tmdb_id],
    queryFn: () => getShowEpisodeLogs(show.tmdb_id),
    staleTime: 30_000,
  });

  const watchedEpisodes = useMemo(() => {
    const seen = new Set<string>();

    return episodeLogs
      .filter((episodeLog) => {
        const key = episodeKey(episodeLog.season_number, episodeLog.episode_number);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        if (a.season_number !== b.season_number) return a.season_number - b.season_number;
        return a.episode_number - b.episode_number;
      });
  }, [episodeLogs]);

  const remainingEpisodes = Math.max(show.number_of_episodes - watchedEpisodes.length, 0);

  const watchedSet = useMemo(
    () => new Set(watchedEpisodes.map((episodeLog) => episodeKey(episodeLog.season_number, episodeLog.episode_number))),
    [watchedEpisodes],
  );

  const { data: showDetails } = useQuery({
    queryKey: ["show", show.tmdb_id],
    queryFn: () => getShowDetails(show.tmdb_id),
    enabled: remainingEpisodes > 0 && show.number_of_seasons > 0,
    staleTime: 30 * 60_000,
  });

  let nextEpisode: { seasonNumber: number; episodeNumber: number } | null = null;

  if (remainingEpisodes > 0) {
    const visibleSeasons = (showDetails?.seasons ?? [])
      .filter((season) => season.season_number > 0)
      .sort((a, b) => a.season_number - b.season_number);

    for (const season of visibleSeasons) {
      for (let episodeNumber = 1; episodeNumber <= season.episode_count; episodeNumber += 1) {
        if (!watchedSet.has(episodeKey(season.season_number, episodeNumber))) {
          nextEpisode = { seasonNumber: season.season_number, episodeNumber };
          break;
        }
      }

      if (nextEpisode) break;
    }

    if (!nextEpisode && watchedEpisodes.length === 0) nextEpisode = { seasonNumber: 1, episodeNumber: 1 };
    if (!nextEpisode && watchedEpisodes.length > 0) {
      const latestEpisode = watchedEpisodes[watchedEpisodes.length - 1];
      nextEpisode = {
        seasonNumber: latestEpisode.season_number,
        episodeNumber: latestEpisode.episode_number + 1,
      };
    }
  }

  const { data: nextEpisodeSeason } = useQuery({
    queryKey: ["season", show.tmdb_id, nextEpisode?.seasonNumber],
    queryFn: () => getSeasonDetails(show.tmdb_id, nextEpisode!.seasonNumber),
    enabled: !!nextEpisode,
    staleTime: 30 * 60_000,
  });

  const nextEpisodeName = useMemo(() => {
    if (!nextEpisode) return null;

    return nextEpisodeSeason?.episodes?.find(
      (episode) => episode.episode_number === nextEpisode.episodeNumber,
    )?.name ?? null;
  }, [nextEpisode, nextEpisodeSeason?.episodes]);

  const remainingAfterNextEpisode = Math.max(remainingEpisodes - (nextEpisode ? 1 : 0), 0);
  const nextEpisodeLabel = nextEpisode
    ? `S${String(nextEpisode.seasonNumber).padStart(2, "0")} E${String(nextEpisode.episodeNumber).padStart(2, "0")}`
    : null;
  const nextEpisodeDetails = nextEpisodeSeason?.episodes?.find(
    (episode) => episode.episode_number === nextEpisode?.episodeNumber,
  );

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
        tmdb_episode_id: nextEpisodeDetails?.id,
        season_number: nextEpisode.seasonNumber,
        episode_number: nextEpisode.episodeNumber,
        episode_name: nextEpisodeDetails?.name ?? nextEpisodeName ?? undefined,
        watched_at: watchedAt,
        rating: rating ?? undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["episode-logs", show.tmdb_id] });
      void queryClient.invalidateQueries({ queryKey: ["episode-logs"] });
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
              <p className="truncate text-sm font-semibold text-blue-400">
                {nextEpisodeLabel ?? "Completed"}
                {nextEpisode ? <span className="ml-2 text-xs font-medium text-slate-500">+{remainingAfterNextEpisode}</span> : null}
              </p>
              <p className="mt-1 truncate text-xs text-slate-400">{nextEpisodeName ?? (nextEpisode ? "Loading episode..." : "All episodes watched")}</p>
            </div>
            {nextEpisode ? (
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
