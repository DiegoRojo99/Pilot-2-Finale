"use client";

import type {
  UserAchievementProgressView,
  EpisodeBatchResponse,
  EpisodeLog,
  ShowStatus,
  StatsPeriod,
  TMDBSearchResult,
  TMDBSeason,
  TMDBShow,
  UserShow,
  UserStats,
} from "@/types";

type RequestOptions = RequestInit & {
  allow404?: boolean;
};

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const next = `${window.location.pathname}${window.location.search}`;
  window.location.href = `/auth/login?next=${encodeURIComponent(next)}`;
}

async function fetchJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { allow404 = false, headers, ...init } = options;
  const response = await fetch(path, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  const status = response.status;
  if (allow404 && status === 404) return null as T;
  if (status === 401) {
    redirectToLogin();
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Request failed");
  }

  if (status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const searchShows = (query: string, page = 1) =>
  fetchJson<TMDBSearchResult>(`/api/shows/search?query=${encodeURIComponent(query)}&page=${page}`);

export const getShowDetails = (id: number) => fetchJson<TMDBShow>(`/api/shows/${id}`);

export const getSeasonDetails = (showId: number, seasonNumber: number) =>
  fetchJson<TMDBSeason>(`/api/shows/${showId}/season/${seasonNumber}`);

export const getTrendingShows = () => fetchJson<TMDBSearchResult>("/api/shows/trending/week");

export const filterOutUnwatchedShowsParams = "&include_null_first_air_dates=false&vote_count.gte=5000";
export const getPopularShows = (page = 1) => fetchJson<TMDBSearchResult>(`/api/shows?page=${page}&sort_by=popularity.desc${filterOutUnwatchedShowsParams}`);

export const getTopRatedShows = (page = 1) =>
  fetchJson<TMDBSearchResult>(`/api/shows/top-rated?page=${page}`);

export const getMyShows = (status?: ShowStatus) =>
  fetchJson<UserShow[]>(status ? `/api/my-shows?status=${status}` : "/api/my-shows");

export const getMyShow = (tmdbId: number) =>
  fetchJson<UserShow | null>(`/api/my-shows/${tmdbId}`, { allow404: true });

export const addShow = (show: Partial<UserShow> & { tmdb_id: number; name: string }) =>
  fetchJson<UserShow>("/api/my-shows", {
    method: "POST",
    body: JSON.stringify(show),
  });

export const updateShowStatus = (tmdbId: number, status: ShowStatus) =>
  fetchJson<UserShow>(`/api/my-shows/${tmdbId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const removeShow = (tmdbId: number) =>
  fetchJson<{ success: boolean }>(`/api/my-shows/${tmdbId}`, {
    method: "DELETE",
  });

export const getEpisodeLogs = (
  tmdbShowId?: number,
  options?: { withWatchDate?: boolean },
) => {
  const params = new URLSearchParams();
  if (tmdbShowId !== undefined) params.set("tmdb_show_id", String(tmdbShowId));
  if (options?.withWatchDate) params.set("with_watch_date", "1");

  const query = params.toString();
  return fetchJson<EpisodeLog[]>(query ? `/api/episodes?${query}` : "/api/episodes");
};

export const getShowEpisodeLogs = (tmdbShowId: number) =>
  fetchJson<EpisodeLog[]>(`/api/episodes/show/${tmdbShowId}`);

export const getShowEpisodeLogsBatch = (tmdbShowIds: number[]) =>
  fetchJson<EpisodeBatchResponse>("/api/episodes/batch", {
    method: "POST",
    body: JSON.stringify({ tmdb_show_ids: tmdbShowIds }),
  });

export const syncShowEpisodeCatalogBatch = (tmdbShowIds: number[]) =>
  fetchJson<{
    results: Array<{
      tmdbShowId: number;
      synced: boolean;
      reason: string;
      expectedEpisodes: number;
      knownEpisodes: number;
    }>;
  }>("/api/episodes/catalog-sync", {
    method: "POST",
    body: JSON.stringify({ tmdb_show_ids: tmdbShowIds }),
  });

export const getEpisodeLogsForEpisode = (
  showId: number,
  seasonNumber: number,
  episodeNumber: number,
) =>
  fetchJson<EpisodeLog[]>(
    `/api/episodes/show/${showId}/season/${seasonNumber}/episode/${episodeNumber}`,
  );

export const logEpisode = (data: {
  tmdb_show_id: number;
  tmdb_episode_id?: number;
  season_number: number;
  episode_number: number;
  episode_name?: string;
  rating?: number;
  notes?: string;
  watched_at?: string | null;
}) =>
  fetchJson<EpisodeLog>("/api/episodes", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const logEpisodesBulk = (data: {
  tmdb_show_id: number;
  episodes: Array<{
    tmdb_episode_id?: number;
    season_number: number;
    episode_number: number;
    episode_name?: string;
    rating?: number;
    notes?: string;
    watched_at?: string | null;
  }>;
}) =>
  fetchJson<{ count: number }>("/api/episodes", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateEpisodeLog = (
  logId: number,
  data: {
    watched_at?: string | null;
    rating?: number | null;
    notes?: string | null;
  },
) =>
  fetchJson<EpisodeLog>(`/api/episodes/${logId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const removeEpisodeLogById = (logId: number) =>
  fetchJson<{ success: boolean }>(`/api/episodes/${logId}`, {
    method: "DELETE",
  });

export const removeEpisodeLog = (showId: number, season: number, episode: number) =>
  fetchJson<{ success: boolean }>(
    `/api/episodes/show/${showId}/season/${season}/episode/${episode}`,
    { method: "DELETE" },
  );

export const getStats = (period: StatsPeriod = "l30d") =>
  fetchJson<UserStats>(`/api/episodes/stats?period=${period}`);

export const getAchievements = () =>
  fetchJson<UserAchievementProgressView[]>("/api/achievements");
