import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search as SearchIcon, X, TrendingUp } from 'lucide-react';
import { searchShows, getTrendingShows, addShow } from '../api';
import { PageShell } from '../components/layout/PageShell';
import { SearchShowCard, PosterCard } from '../components/show/ShowCard';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import type { TMDBShow, UserShow } from '../types';

function useDebounce(value: string, delay = 400): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);
  const queryClient = useQueryClient();

  const { data: searchData, isLoading: searchLoading, error: searchError } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchShows(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 60_000,
  });

  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: getTrendingShows,
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
        status: 'want_to_watch',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shows'] });
    },
  });

  const addedIds = new Set(
    (queryClient.getQueryData<UserShow[]>(['my-shows']) ?? []).map((s: UserShow) => s.tmdb_id)
  );

  const isSearching = debouncedQuery.trim().length >= 2;

  return (
    <PageShell title="Discover">
      {/* Search Bar */}
      <div className="relative mb-5">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Search TV shows…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-slate-800 rounded-xl pl-9 pr-9 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 active:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {isSearching && (
        <>
          {searchLoading && <PageLoader />}
          {searchError && <ErrorMessage message="Search failed. Check your connection." />}
          {searchData && (
            <>
              <p className="text-xs text-slate-500 mb-3">
                {searchData.total_results} result{searchData.total_results !== 1 ? 's' : ''} for &ldquo;{debouncedQuery}&rdquo;
              </p>
              {searchData.results.length === 0 ? (
                <div className="text-center text-slate-500 py-12 text-sm">No shows found</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {searchData.results.map((show: TMDBShow) => (
                    <SearchShowCard
                      key={show.id}
                      show={show}
                      isAdded={addedIds.has(show.id)}
                      onAdd={(s: TMDBShow) => addMutation.mutate(s)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Trending (shown when not searching) */}
      {!isSearching && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200">Trending This Week</h2>
          </div>
          {trendingLoading && <PageLoader />}
          {trendingData && (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {trendingData.results.slice(0, 15).map((show: TMDBShow) => (
                <PosterCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
