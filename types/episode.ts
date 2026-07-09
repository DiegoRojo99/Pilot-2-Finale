export interface EpisodeLog {
  id: number;
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