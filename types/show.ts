import type { EpisodeLog } from "./episode";
export type ShowStatus = "watching" | "want_to_watch" | "watched" | "dropped" | "on_hold";

export interface ShowRecord {
  tmdb_id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  first_air_date: string | null;
  vote_average: number;
  number_of_seasons: number;
  number_of_episodes: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserShow {
  id: number;
  tmdb_id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  first_air_date: string | null;
  status: ShowStatus;
  vote_average: number;
  number_of_seasons: number;
  number_of_episodes: number;
  added_at: string;
  updated_at: string;
}

export interface UserShowWithShowRow {
  id: number;
  tmdbId: number;
  name?: string | null;
  status: ShowStatus | string;
  addedAt: Date;
  updatedAt: Date;
  show: {
    name: string;
    posterPath: string | null;
    backdropPath: string | null;
    overview: string | null;
    firstAirDate: string | null;
    voteAverage: number;
    numberOfSeasons: number;
    numberOfEpisodes: number;
  };
}

export interface ShowNextEpisode {
  tmdb_episode_id: number | null;
  season_number: number;
  episode_number: number;
  episode_name: string | null;
  has_reliable_next: boolean;
}

export interface ShowProgress {
  tmdb_show_id: number;
  watched_unique_count: number;
  number_of_episodes: number;
  next_episode: ShowNextEpisode | null;
}

export interface EpisodeBatchResponse {
  logsByShowId: Record<number, EpisodeLog[]>;
  progressByShowId: Record<number, ShowProgress>;
}

export const STATUS_LABELS: Record<ShowStatus, string> = {
  watching: "Watching",
  want_to_watch: "Watchlist",
  watched: "Completed",
  dropped: "Dropped",
  on_hold: "On Hold",
};

export const STATUS_COLORS: Record<ShowStatus, string> = {
  watching: "bg-blue-400/10 text-blue-400",
  want_to_watch: "bg-purple-400/10 text-purple-400",
  watched: "bg-green-400/10 text-green-400",
  dropped: "bg-red-400/10 text-red-400",
  on_hold: "bg-yellow-400/10 text-yellow-400",
};