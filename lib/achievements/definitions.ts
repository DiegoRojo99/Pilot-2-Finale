import type { AchievementCategory, AchievementIconKind, AchievementMetricType } from "@/types";

type TierSeed = {
  name: string;
  level: number;
  requiredCount: number;
  colorToken: string;
};

export type AchievementSeed = {
  key: string;
  title: string;
  description: string;
  category: AchievementCategory;
  metricType: AchievementMetricType;
  icon: string;
  iconKind: AchievementIconKind;
  sortOrder: number;
  tiers: TierSeed[];
};

export const DEFAULT_ACHIEVEMENT_TIERS: TierSeed[] = [
  { name: "Bronze", level: 1, requiredCount: 0, colorToken: "bronze" },
  { name: "Silver", level: 2, requiredCount: 0, colorToken: "silver" },
  { name: "Gold", level: 3, requiredCount: 0, colorToken: "gold" },
  { name: "Platinum", level: 4, requiredCount: 0, colorToken: "platinum" },
  { name: "Diamond", level: 5, requiredCount: 0, colorToken: "diamond" },
];

export const ACHIEVEMENT_DEFINITIONS: AchievementSeed[] = [
  {
    key: "episodes_watched_total",
    title: "First Steps",
    description: "Watch more episodes across your full history.",
    category: "volume",
    metricType: "episodes_watched_total",
    icon: "book-open",
    iconKind: "name",
    sortOrder: 10,
    tiers: [
      { ...DEFAULT_ACHIEVEMENT_TIERS[0], requiredCount: 25 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[1], requiredCount: 100 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[2], requiredCount: 250 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[3], requiredCount: 500 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[4], requiredCount: 1000 },
    ],
  },
  {
    key: "shows_completed_total",
    title: "Show Finisher",
    description: "Complete more shows from your list.",
    category: "completion",
    metricType: "shows_completed_total",
    icon: "tv",
    iconKind: "name",
    sortOrder: 20,
    tiers: [
      { ...DEFAULT_ACHIEVEMENT_TIERS[0], requiredCount: 5 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[1], requiredCount: 25 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[2], requiredCount: 50 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[3], requiredCount: 100 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[4], requiredCount: 250 },
    ],
  },
  {
    key: "seasons_completed_total",
    title: "Season Closer",
    description: "Finish full seasons over time.",
    category: "completion",
    metricType: "seasons_completed_total",
    icon: "clapperboard",
    iconKind: "name",
    sortOrder: 30,
    tiers: [
      { ...DEFAULT_ACHIEVEMENT_TIERS[0], requiredCount: 25 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[1], requiredCount: 100 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[2], requiredCount: 250 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[3], requiredCount: 500 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[4], requiredCount: 1000 },
    ],
  },
  {
    key: "minutes_watched_total",
    title: "Marathon Viewer",
    description: "Accumulate total watch time.",
    category: "volume",
    metricType: "minutes_watched_total",
    icon: "clock-3",
    iconKind: "name",
    sortOrder: 40,
    tiers: [
      { ...DEFAULT_ACHIEVEMENT_TIERS[0], requiredCount: 5000 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[1], requiredCount: 25000 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[2], requiredCount: 75000 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[3], requiredCount: 150000 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[4], requiredCount: 300000 },
    ],
  },
  {
    key: "episodes_watched_best_day",
    title: "Binge Mode",
    description: "Hit your biggest single-day binge.",
    category: "streak",
    metricType: "episodes_watched_best_day",
    icon: "flame",
    iconKind: "name",
    sortOrder: 50,
    tiers: [
      { ...DEFAULT_ACHIEVEMENT_TIERS[0], requiredCount: 3 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[1], requiredCount: 6 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[2], requiredCount: 10 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[3], requiredCount: 15 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[4], requiredCount: 20 },
    ],
  },
  {
    key: "active_days_total",
    title: "Habit Builder",
    description: "Log activity on more distinct days.",
    category: "streak",
    metricType: "active_days_total",
    icon: "calendar-check-2",
    iconKind: "name",
    sortOrder: 60,
    tiers: [
      { ...DEFAULT_ACHIEVEMENT_TIERS[0], requiredCount: 7 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[1], requiredCount: 30 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[2], requiredCount: 90 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[3], requiredCount: 180 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[4], requiredCount: 365 },
    ],
  },
  {
    key: "watchlist_to_watched_total",
    title: "Watchlist Cleaner",
    description: "Move watchlist shows to completed over time.",
    category: "watchlist",
    metricType: "watchlist_to_watched_total",
    icon: "list-checks",
    iconKind: "name",
    sortOrder: 70,
    tiers: [
      { ...DEFAULT_ACHIEVEMENT_TIERS[0], requiredCount: 5 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[1], requiredCount: 20 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[2], requiredCount: 50 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[3], requiredCount: 100 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[4], requiredCount: 200 },
    ],
  },
  {
    key: "distinct_genres_watched_total",
    title: "Genre Explorer",
    description: "Watch across more genres.",
    category: "exploration",
    metricType: "distinct_genres_watched_total",
    icon: "compass",
    iconKind: "name",
    sortOrder: 80,
    tiers: [
      { ...DEFAULT_ACHIEVEMENT_TIERS[0], requiredCount: 3 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[1], requiredCount: 6 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[2], requiredCount: 10 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[3], requiredCount: 15 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[4], requiredCount: 20 },
    ],
  },
  {
    key: "episodes_rated_total",
    title: "Top Rater",
    description: "Rate more episodes.",
    category: "quality",
    metricType: "episodes_rated_total",
    icon: "star",
    iconKind: "name",
    sortOrder: 90,
    tiers: [
      { ...DEFAULT_ACHIEVEMENT_TIERS[0], requiredCount: 25 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[1], requiredCount: 100 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[2], requiredCount: 250 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[3], requiredCount: 500 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[4], requiredCount: 1000 },
    ],
  },
  {
    key: "unique_episodes_watched_total",
    title: "Completionist",
    description: "Watch unique episodes across your catalog.",
    category: "volume",
    metricType: "unique_episodes_watched_total",
    icon: "medal",
    iconKind: "name",
    sortOrder: 100,
    tiers: [
      { ...DEFAULT_ACHIEVEMENT_TIERS[0], requiredCount: 100 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[1], requiredCount: 500 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[2], requiredCount: 1500 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[3], requiredCount: 3000 },
      { ...DEFAULT_ACHIEVEMENT_TIERS[4], requiredCount: 5000 },
    ],
  },
];
