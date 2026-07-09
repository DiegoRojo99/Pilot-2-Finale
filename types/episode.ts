export interface EpisodeLog {
  id: number;
  episode_id?: number;
  tmdb_episode_id?: number | null;
  tmdb_show_id: number;
  season_number: number;
  episode_number: number;
  episode_name: string | null;
  watched_at: string;
  created_at: string;
  updated_at: string;
  rating: number | null;
  notes: string | null;
  show_name?: string;
  poster_path?: string | null;
}