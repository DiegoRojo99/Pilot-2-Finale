export function getPosterUrl(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w342${path}` : null;
}

export function getYear(firstAirDate: string) {
  return firstAirDate ? firstAirDate.slice(0, 4) : 'Unknown year';
}