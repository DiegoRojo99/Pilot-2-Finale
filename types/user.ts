export type StatsPeriod = "l7d" | "l30d" | "ly";

export interface UserStats {
  period: StatsPeriod;
  totalEpisodes: number;
  totalShows: number;
  watchingShows: number;
  watchedShows: number;
  wantToWatch: number;
  timeSpentMinutes: number;
  pendingEpisodesWatching: number;
  pendingRuntimeMinutesWatching: number;
}