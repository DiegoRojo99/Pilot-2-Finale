const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const getPosterUrl = (path: string | null | undefined, size: 'w185' | 'w342' | 'w500' = 'w342'): string => {
  if (!path) return '/placeholder-poster.svg';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const getBackdropUrl = (path: string | null | undefined, size: 'w780' | 'w1280' = 'w780'): string => {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const getStillUrl = (path: string | null | undefined, size: 'w185' | 'w300' | 'w780' = 'w300'): string => {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatYear = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  return new Date(dateStr).getFullYear().toString();
};

export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

export const episodeKey = (season: number, episode: number): string =>
  `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
