import { apiRequest } from '@/lib/api';

export interface AchievementTier {
  id: number;
  name: string;
  level: number;
  required_count: number;
  color_token: string | null;
}

export interface AchievementProgress {
  achievement_id: number;
  current_count: number;
  progress_percent: number;
  highest_tier_level: number;
  unlocked_at: string | null;
  current_tier: AchievementTier | null;
  next_tier: AchievementTier | null;
  achievement: {
    id: number;
    key: string;
    title: string;
    description: string;
    category: string;
    sort_order: number;
    tiers: AchievementTier[];
  };
}

export function getAchievements() {
  return apiRequest<AchievementProgress[]>('/api/achievements');
}

export function isUnlocked(item: AchievementProgress) {
  return item.highest_tier_level > 0 || item.unlocked_at !== null;
}
