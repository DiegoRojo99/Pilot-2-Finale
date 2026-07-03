import { useNavigate } from 'react-router-dom';
import { getPosterUrl, formatYear } from '../../utils';
import { RatingBadge } from '../ui/RatingBadge';
import { StatusBadge } from '../ui/StatusBadge';
import type { UserShow } from '../../types';
import type { TMDBShow } from '../../types';

// Card for a user's tracked show
interface UserShowCardProps {
  show: UserShow;
}

export function UserShowCard({ show }: UserShowCardProps) {
  const navigate = useNavigate();
  return (
    <div
      className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl active:bg-slate-700/60 transition-colors cursor-pointer"
      onClick={() => navigate(`/show/${show.tmdb_id}`)}
    >
      <img
        src={getPosterUrl(show.poster_path, 'w185')}
        alt={show.name}
        className="w-14 h-20 object-cover rounded-lg flex-shrink-0 bg-slate-700"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-slate-100 truncate">{show.name}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{formatYear(show.first_air_date)}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <StatusBadge status={show.status} size="sm" />
          {show.vote_average > 0 && <RatingBadge rating={show.vote_average} size="sm" />}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {show.number_of_seasons} season{show.number_of_seasons !== 1 ? 's' : ''}
          {show.number_of_episodes > 0 && ` · ${show.number_of_episodes} eps`}
        </p>
      </div>
    </div>
  );
}

// Card for search results
interface SearchShowCardProps {
  show: TMDBShow;
  onAdd?: (show: TMDBShow) => void;
  isAdded?: boolean;
}

export function SearchShowCard({ show, onAdd, isAdded }: SearchShowCardProps) {
  const navigate = useNavigate();
  return (
    <div
      className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl active:bg-slate-700/60 transition-colors cursor-pointer"
      onClick={() => navigate(`/show/${show.id}`)}
    >
      <img
        src={getPosterUrl(show.poster_path, 'w185')}
        alt={show.name}
        className="w-14 h-20 object-cover rounded-lg flex-shrink-0 bg-slate-700"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-slate-100 truncate">{show.name}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{formatYear(show.first_air_date)}</p>
        {show.vote_average > 0 && (
          <div className="mt-1">
            <RatingBadge rating={show.vote_average} size="sm" />
          </div>
        )}
        {show.overview && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{show.overview}</p>
        )}
      </div>
      {onAdd && (
        <button
          onClick={(e) => { e.stopPropagation(); onAdd(show); }}
          disabled={isAdded}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg transition-colors ${
            isAdded
              ? 'bg-green-500/20 text-green-400'
              : 'bg-blue-500/20 text-blue-400 active:bg-blue-500/40'
          }`}
        >
          {isAdded ? '✓' : '+'}
        </button>
      )}
    </div>
  );
}

// Horizontal poster card for trending/popular grids
interface PosterCardProps {
  show: TMDBShow;
}

export function PosterCard({ show }: PosterCardProps) {
  const navigate = useNavigate();
  return (
    <div
      className="flex-shrink-0 w-28 cursor-pointer"
      onClick={() => navigate(`/show/${show.id}`)}
    >
      <img
        src={getPosterUrl(show.poster_path, 'w185')}
        alt={show.name}
        className="w-28 h-40 object-cover rounded-xl bg-slate-700"
        loading="lazy"
      />
      <p className="text-xs text-slate-300 mt-1.5 truncate font-medium">{show.name}</p>
      {show.vote_average > 0 && (
        <RatingBadge rating={show.vote_average} size="sm" />
      )}
    </div>
  );
}
