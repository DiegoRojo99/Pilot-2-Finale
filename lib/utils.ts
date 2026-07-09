const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function getPosterUrl(
  path: string | null | undefined,
  size: "w185" | "w342" | "w500" = "w342",
) {
  if (!path) return "/placeholder-poster.svg";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(
  path: string | null | undefined,
  size: "w780" | "w1280" = "w780",
) {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatYear(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  return new Date(dateStr).getFullYear().toString();
}

export function formatRating(rating: number) {
  return rating.toFixed(1);
}

export function episodeKey(season: number, episode: number) {
  return `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;
}
