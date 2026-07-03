import axios from 'axios';
import type {
  TMDBSearchResult,
  TMDBShow,
  TMDBSeason,
  UserShow,
  EpisodeLog,
  ShowStatus,
  UserStats,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── TMDB ──────────────────────────────────────────────────────────────────────

export const searchShows = (query: string, page = 1): Promise<TMDBSearchResult> =>
  api.get('/shows/search', { params: { query, page } }).then((r) => r.data);

export const getShowDetails = (id: number): Promise<TMDBShow> =>
  api.get(`/shows/${id}`).then((r) => r.data);

export const getSeasonDetails = (showId: number, seasonNumber: number): Promise<TMDBSeason> =>
  api.get(`/shows/${showId}/season/${seasonNumber}`).then((r) => r.data);

export const getTrendingShows = (): Promise<TMDBSearchResult> =>
  api.get('/shows/trending/week').then((r) => r.data);

export const getPopularShows = (page = 1): Promise<TMDBSearchResult> =>
  api.get('/shows', { params: { page } }).then((r) => r.data);

// ── USER SHOWS ────────────────────────────────────────────────────────────────

export const getMyShows = (status?: ShowStatus): Promise<UserShow[]> =>
  api.get('/my-shows', { params: status ? { status } : {} }).then((r) => r.data);

export const getMyShow = (tmdbId: number): Promise<UserShow> =>
  api.get(`/my-shows/${tmdbId}`).then((r) => r.data);

export const addShow = (show: Partial<UserShow> & { tmdb_id: number; name: string }): Promise<UserShow> =>
  api.post('/my-shows', show).then((r) => r.data);

export const updateShowStatus = (tmdbId: number, status: ShowStatus): Promise<UserShow> =>
  api.patch(`/my-shows/${tmdbId}`, { status }).then((r) => r.data);

export const removeShow = (tmdbId: number): Promise<void> =>
  api.delete(`/my-shows/${tmdbId}`).then((r) => r.data);

// ── EPISODE LOGS ──────────────────────────────────────────────────────────────

export const getEpisodeLogs = (tmdbShowId?: number): Promise<EpisodeLog[]> =>
  api.get('/episodes', { params: tmdbShowId ? { tmdb_show_id: tmdbShowId } : {} }).then((r) => r.data);

export const getShowEpisodeLogs = (tmdbShowId: number): Promise<EpisodeLog[]> =>
  api.get(`/episodes/show/${tmdbShowId}`).then((r) => r.data);

export const logEpisode = (data: {
  tmdb_show_id: number;
  season_number: number;
  episode_number: number;
  episode_name?: string;
  rating?: number;
  notes?: string;
}): Promise<EpisodeLog> =>
  api.post('/episodes', data).then((r) => r.data);

export const removeEpisodeLog = (showId: number, season: number, episode: number): Promise<void> =>
  api.delete(`/episodes/show/${showId}/season/${season}/episode/${episode}`).then((r) => r.data);

export const getStats = (): Promise<UserStats> =>
  api.get('/episodes/stats').then((r) => r.data);
