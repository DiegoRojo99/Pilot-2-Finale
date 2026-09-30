"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search as SearchIcon, Star, TrendingUp, X } from "lucide-react";
import { addShow, getMyShows, getTopRatedShows, getTrendingShows, searchShows } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import { PosterCard, SearchShowCard } from "@/components/show/ShowCard";
import { ErrorMessage, PageLoader } from '@/components/ui';
import type { TMDBShow } from "@/types";

function useDebounce(value: string, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timerId = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timerId);
  }, [delay, value]);

  return debounced;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const queryClient = useQueryClient();

  const { data: myShows = [] } = useQuery({
    queryKey: ["my-shows"],
    queryFn: () => getMyShows(),
    staleTime: 30_000,
  });

  const { data: searchData, isLoading: searchLoading, error: searchError } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchShows(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 60_000,
  });

  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ["trending"],
    queryFn: getTrendingShows,
    staleTime: 10 * 60_000,
  });

  const { data: topRatedData, isLoading: topRatedLoading } = useQuery({
    queryKey: ["top-rated"],
    queryFn: () => getTopRatedShows(),
    staleTime: 10 * 60_000,
  });

  const addMutation = useMutation({
    mutationFn: (show: TMDBShow) =>
      addShow({
        tmdb_id: show.id,
        name: show.name,
        poster_path: show.poster_path,
        backdrop_path: show.backdrop_path,
        overview: show.overview,
        first_air_date: show.first_air_date,
        vote_average: show.vote_average,
        status: "want_to_watch",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-shows"] });
    },
  });

  const addedIds = new Set(myShows.map((show) => show.tmdb_id));
  const isSearching = debouncedQuery.trim().length >= 2;

  return (
    <PageShell title="Discover">
      <div className="relative mb-5">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search TV shows…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-xl bg-slate-800 py-3 pr-9 pl-9 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 active:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isSearching && (
        <>
          {searchLoading && <PageLoader />}
          {searchError && <ErrorMessage message="Search failed. Check your connection." />}
          {searchData && (
            <>
              <p className="mb-3 text-xs text-slate-500">
                {searchData.total_results} result{searchData.total_results !== 1 ? "s" : ""} for “
                {debouncedQuery}”
              </p>
              {searchData.results.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">No shows found</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {searchData.results.map((show) => (
                    <SearchShowCard
                      key={show.id}
                      show={show}
                      isAdded={addedIds.has(show.id)}
                      onAdd={(selectedShow) => addMutation.mutate(selectedShow)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {!isSearching && (
        <>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200">Trending This Week</h2>
          </div>
          {trendingLoading && <PageLoader />}
          {trendingData && (
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
              {trendingData.results.slice(0, 15).map((show) => (
                <PosterCard key={show.id} show={show} />
              ))}
            </div>
          )}

          <div className="mt-6 mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200">Top Rated</h2>
          </div>
          {topRatedLoading && <PageLoader />}
          {topRatedData && (
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
              {topRatedData.results.slice(0, 15).map((show) => (
                <PosterCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
