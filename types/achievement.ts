import { Achievement, AchievementTier, UserAchievementProgress } from "@prisma/client";

export type AchievementCategory =
  | "volume"
  | "completion"
  | "streak"
  | "watchlist"
  | "exploration"
  | "quality";

export type AchievementIconKind = "name" | "path";

export type AchievementMetricType =
  | "episodes_watched_total"
  | "shows_completed_total"
  | "seasons_completed_total"
  | "minutes_watched_total"
  | "episodes_watched_best_day"
  | "active_days_total"
  | "watchlist_to_watched_total"
  | "distinct_genres_watched_total"
  | "episodes_rated_total"
  | "unique_episodes_watched_total";

export interface AchievementTierView {
  id: number;
  name: string;
  level: number;
  required_count: number;
  color_token: string | null;
}

export interface AchievementView {
  id: number;
  key: string;
  title: string;
  description: string;
  category: AchievementCategory;
  metric_type: AchievementMetricType;
  active: boolean;
  icon: string | null;
  icon_kind: AchievementIconKind;
  sort_order: number;
  tiers: AchievementTierView[];
}

export interface UserAchievementProgressView {
  achievement_id: number;
  current_count: number;
  progress_percent: number;
  highest_tier_level: number;
  unlocked_at: string | null;
  current_tier: AchievementTierView | null;
  next_tier: AchievementTierView | null;
  achievement: AchievementView;
}

export type AchievementWithTiers = Omit<Achievement, "iconKind"> & {
  iconKind?: AchievementIconKind | string;
  tiers: AchievementTier[];
};

export type UserAchievementProgressWithAchievement = UserAchievementProgress & {
  currentTier: AchievementTier | null;
  achievement: AchievementWithTiers;
};