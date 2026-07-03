import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Check, ChevronDown, ChevronUp, Star, Trash2, Calendar
} from 'lucide-react';
import {
  getShowDetails, getSeasonDetails, getMyShow,
  addShow, updateShowStatus, removeShow, logEpisode, removeEpisodeLog, getShowEpisodeLogs
} from '../api';
import { PageShell } from '../components/layout/PageShell';
import { StatusBadge } from '../components/ui/StatusBadge';
import { RatingBadge } from '../components/ui/RatingBadge';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { getPosterUrl, getBackdropUrl, formatDate, episodeKey } from '../utils';
import type { ShowStatus, TMDBEpisode, EpisodeLog } from '../types';
import { STATUS_LABELS } from '../types';

const ALL_STATUSES: ShowStatus[] = ['watching', 'want_to_watch', 'watched', 'on_hold', 'dropped'];

function StatusPicker({
  current,
  onChange,
  onRemove,
}: {
  current: ShowStatus | null;
  onChange: (s: ShowStatus) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 rounded-xl text-sm font-medium text-slate-200 active:bg-slate-600"
      >
        {current ? STATUS_LABELS[current] : 'Add to List'}
        <ChevronDown className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 min-w-[180px] overflow-hidden">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                current === s ? 'text-blue-400 bg-blue-400/10' : 'text-slate-300 active:bg-slate-700'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
          {current && (
            <>
              <div className="border-t border-slate-700" />
              <button
                onClick={() => { onRemove(); setOpen(false); }}
                className="w-full text-left px-4 py-3 text-sm text-red-400 active:bg-slate-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Remove from list
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
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
      <button
        onClick={onToggle}
        className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
          isWatched
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-slate-600 text-transparent active:border-slate-400'
        }`}
      >
        <Check className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 flex-shrink-0">
            {String(episode.episode_number).padStart(2, '0')}
          </span>
          <span className={`text-sm truncate ${isWatched ? 'text-slate-400' : 'text-slate-200'}`}>
            {episode.name}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 ml-6">
          {episode.air_date && (
            <span className="text-xs text-slate-600 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDate(episode.air_date)}
            </span>
          )}
          {episode.vote_average > 0 && (
            <span className="text-xs text-amber-500 flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-current" /> {episode.vote_average.toFixed(1)}
            </span>
          )}
          {episode.runtime && (
            <span className="text-xs text-slate-600">{episode.runtime}m</span>
          )}
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
  onToggleEpisode: (s: number, e: number, name: string, watched: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const { data: seasonData, isLoading } = useQuery({
    queryKey: ['season', showId, seasonNumber],
    queryFn: () => getSeasonDetails(showId, seasonNumber),
    enabled: expanded,
    staleTime: 30 * 60_000,
  });

  const watchedCount = seasonData?.episodes?.filter(
    (ep: TMDBEpisode) => watchedSet.has(episodeKey(ep.season_number, ep.episode_number))
  ).length ?? 0;

  return (
    <div className="bg-slate-800/50 rounded-xl overflow-hidden mb-2">
      <button
        className="w-full flex items-center justify-between p-4"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="text-left">
          <p className="text-sm font-semibold text-slate-200">{seasonName}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {watchedCount}/{episodeCount} episodes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* progress bar */}
          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${episodeCount > 0 ? (watchedCount / episodeCount) * 100 : 0}%` }}
            />
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-3">
          {isLoading && (
            <div className="py-4 text-center text-sm text-slate-500">Loading episodes…</div>
          )}
          {seasonData?.episodes?.map((ep: TMDBEpisode) => (
            <EpisodeRow
              key={ep.id}
              episode={ep}
              isWatched={watchedSet.has(episodeKey(ep.season_number, ep.episode_number))}
              onToggle={() =>
                onToggleEpisode(
                  ep.season_number,
                  ep.episode_number,
                  ep.name,
                  watchedSet.has(episodeKey(ep.season_number, ep.episode_number))
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
  const { id } = useParams<{ id: string }>();
  const showId = Number(id);
  const queryClient = useQueryClient();

  const { data: show, isLoading: showLoading, error: showError } = useQuery({
    queryKey: ['show', showId],
    queryFn: () => getShowDetails(showId),
    staleTime: 30 * 60_000,
  });

  const { data: userShow } = useQuery({
    queryKey: ['my-show', showId],
    queryFn: () => getMyShow(showId),
    retry: false,
    staleTime: 30_000,
  });

  const { data: episodeLogs = [] } = useQuery({
    queryKey: ['episode-logs', showId],
    queryFn: () => getShowEpisodeLogs(showId),
    staleTime: 30_000,
  });

  const watchedSet = useMemo(() => {
    const set = new Set<string>();
    episodeLogs.forEach((l: EpisodeLog) => set.add(episodeKey(l.season_number, l.episode_number)));
    return set;
  }, [episodeLogs]);

  const statusMutation = useMutation({
    mutationFn: async (status: ShowStatus) => {
      if (!show) return;
      if (userShow) {
        return updateShowStatus(showId, status);
      } else {
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
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-show', showId] });
      queryClient.invalidateQueries({ queryKey: ['my-shows'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeShow(showId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-show', showId] });
      queryClient.invalidateQueries({ queryKey: ['my-shows'] });
    },
  });

  const toggleEpisodeMutation = useMutation({
    mutationFn: async ({
      season, episode, name, watched
    }: { season: number; episode: number; name: string; watched: boolean }) => {
      if (watched) {
        return removeEpisodeLog(showId, season, episode);
      } else {
        return logEpisode({
          tmdb_show_id: showId,
          season_number: season,
          episode_number: episode,
          episode_name: name,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['episode-logs', showId] });
      queryClient.invalidateQueries({ queryKey: ['episode-logs'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  if (showLoading) return <PageShell showBack><PageLoader /></PageShell>;
  if (showError || !show) return (
    <PageShell showBack>
      <ErrorMessage message="Failed to load show details" />
    </PageShell>
  );

  type TMDBSeasonSummary = { season_number: number; episode_count: number; name: string };
  const visibleSeasons = ((show as unknown as { seasons?: TMDBSeasonSummary[] }).seasons ?? []).filter(
    (s: TMDBSeasonSummary) => s.season_number > 0
  );

  return (
    <PageShell showBack noPadding>
      {/* Backdrop */}
      <div className="relative">
        {show.backdrop_path ? (
          <div className="relative h-48 overflow-hidden">
            <img
              src={getBackdropUrl(show.backdrop_path)}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
          </div>
        ) : (
          <div className="h-20" />
        )}

        {/* Poster + title row */}
        <div className="px-4 flex gap-4 -mt-16 relative">
          <img
            src={getPosterUrl(show.poster_path, 'w342')}
            alt={show.name}
            className="w-24 h-36 object-cover rounded-xl shadow-xl flex-shrink-0 bg-slate-700"
          />
          <div className="flex-1 min-w-0 pt-20">
            <h1 className="text-lg font-bold text-slate-100 leading-tight">{show.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {show.first_air_date && (
                <span className="text-xs text-slate-400">{new Date(show.first_air_date).getFullYear()}</span>
              )}
              {show.vote_average > 0 && <RatingBadge rating={show.vote_average} size="sm" />}
              {userShow && <StatusBadge status={userShow.status} size="sm" />}
            </div>
          </div>
        </div>

        {/* Status picker */}
        <div className="px-4 mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {show.number_of_seasons && (
              <span>{show.number_of_seasons} season{show.number_of_seasons !== 1 ? 's' : ''}</span>
            )}
            {show.number_of_episodes && (
              <span>· {show.number_of_episodes} eps</span>
            )}
          </div>
          <StatusPicker
            current={userShow?.status ?? null}
            onChange={(s) => statusMutation.mutate(s)}
            onRemove={() => removeMutation.mutate()}
          />
        </div>

        {/* Genres */}
        {show.genres && show.genres.length > 0 && (
          <div className="px-4 mt-3 flex gap-2 overflow-x-auto pb-1">
            {show.genres.map((g: { id: number; name: string }) => (
              <span key={g.id} className="flex-shrink-0 text-xs px-2.5 py-1 bg-slate-700/60 rounded-full text-slate-300">
                {g.name}
              </span>
            ))}
          </div>
        )}

        {/* Overview */}
        {show.overview && (
          <div className="px-4 mt-3">
            <p className="text-sm text-slate-400 leading-relaxed">{show.overview}</p>
          </div>
        )}

        {/* Networks */}
        {show.networks && show.networks.length > 0 && (
          <div className="px-4 mt-2">
            <p className="text-xs text-slate-500">
              {show.networks.map((n: { id: number; name: string }) => n.name).join(', ')}
            </p>
          </div>
        )}

        {/* Seasons */}
        {userShow && visibleSeasons.length > 0 && (
          <div className="px-4 mt-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" /> Track Episodes
            </h2>
            {visibleSeasons.map((season) => (
              <SeasonAccordion
                key={season.season_number}
                showId={showId}
                seasonNumber={season.season_number}
                episodeCount={season.episode_count}
                seasonName={season.name}
                watchedSet={watchedSet}
                onToggleEpisode={(s, e, name, watched) =>
                  toggleEpisodeMutation.mutate({ season: s, episode: e, name, watched })
                }
              />
            ))}
          </div>
        )}

        {!userShow && show.number_of_seasons && show.number_of_seasons > 0 && (
          <div className="px-4 mt-4 py-4 bg-slate-800/40 mx-4 rounded-xl text-center">
            <p className="text-sm text-slate-400">Add this show to your list to track episodes</p>
          </div>
        )}

        <div className="h-6" />
      </div>
    </PageShell>
  );
}
