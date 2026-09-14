export function getPosterUrl(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w342${path}` : null;
}

export function getBackdropUrl(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w780${path}` : null;
}

export function getStillUrl(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w300${path}` : null;
}

export function getYear(firstAirDate: string) {
  return firstAirDate ? firstAirDate.slice(0, 4) : 'Unknown year';
}

export function formatAirDate(date: string) {
  if (!date) return 'No air date';

  const parsedDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return date;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsedDate);
}