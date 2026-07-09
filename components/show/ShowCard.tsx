"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getPosterUrl, formatYear } from "@/lib/utils";
import { getShowEpisodeLogs } from "@/lib/api";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { TMDBShow, UserShow } from "@/types";

type UserShowCardProps = {
  show: UserShow;
};

export function UserShowCard({ show }: UserShowCardProps) {
  const router = useRouter();

  const { data: episodeLogs = [] } = useQuery({
    queryKey: ["episode-logs", show.tmdb_id],
    queryFn: () => getShowEpisodeLogs(show.tmdb_id),
    staleTime: 30_000,
  });

  // Find the latest watched episode
  const latestEpisode = episodeLogs.length > 0
    ? episodeLogs.sort((a, b) => {
        if (a.season_number !== b.season_number) return b.season_number - a.season_number;
        return b.episode_number - a.episode_number;
      })[0]
    : null;

  return (
    <button
      type="button"
      onClick={() => router.push(`/show/${show.tmdb_id}`)}
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
        <div className="mt-1.5 flex items-center gap-2">
          <StatusBadge status={show.status} size="sm" />
          {show.vote_average > 0 && <RatingBadge rating={show.vote_average} size="sm" />}
        </div>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {show.number_of_seasons} season{show.number_of_seasons !== 1 ? "s" : ""}
            {show.number_of_episodes > 0 ? ` · ${show.number_of_episodes} eps` : ""}
          </p>
          {latestEpisode && (
            <p className="text-xs font-medium text-blue-400">
              S{String(latestEpisode.season_number).padStart(2, "0")} E{String(latestEpisode.episode_number).padStart(2, "0")}
            </p>
          )}
        </div>
      </div>
    </button>
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
