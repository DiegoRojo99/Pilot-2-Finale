import type { EpisodeLog } from '@/types/episode';

export interface TrendDataPoint {
  label: string;
  count: number;
}

export interface YearDashboardStats {
  year: number;
  episodesThisYear: number;
  daysWatched: number;
  avgPerDay: number;
  currentStreak: number;
  longestStreak: number;
  bestDay: { date: Date; count: number } | null;
  bestMonth: { month: number; year: number; count: number } | null;
}

function dayIndex(date: Date): number {
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

export function computeYearDashboard(logs: EpisodeLog[], now: Date = new Date()): YearDashboardStats {
  const year = now.getFullYear();
  const daysSet = new Map<number, number>(); // day index -> episodes that day
  const monthsMap = new Map<string, number>(); // "YYYY-MM" -> episode count
  let episodesThisYear = 0;

  for (const log of logs) {
    if (!log.watched_at) continue;
    const date = new Date(log.watched_at);
    if (Number.isNaN(date.getTime())) continue;
    if (date.getFullYear() !== year) continue;
    episodesThisYear++;
    const idx = dayIndex(date);
    daysSet.set(idx, (daysSet.get(idx) ?? 0) + 1);

    // Track by month
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthsMap.set(monthKey, (monthsMap.get(monthKey) ?? 0) + 1);
  }

  // Find best day
  let bestDayIdx: number | null = null;
  let bestDayCount = 0;
  for (const [idx, count] of daysSet) {
    if (count > bestDayCount) {
      bestDayCount = count;
      bestDayIdx = idx;
    }
  }
  const bestDay =
    bestDayIdx !== null
      ? { date: new Date(bestDayIdx * 86400000), count: bestDayCount }
      : null;

  // Find best month
  let bestMonthKey: string | null = null;
  let bestMonthCount = 0;
  for (const [key, count] of monthsMap) {
    if (count > bestMonthCount) {
      bestMonthCount = count;
      bestMonthKey = key;
    }
  }
  const bestMonth =
    bestMonthKey !== null
      ? (() => {
          const [y, m] = bestMonthKey.split('-');
          return { month: parseInt(m, 10) - 1, year: parseInt(y, 10), count: bestMonthCount };
        })()
      : null;

  const sortedDays = [...daysSet.keys()].sort((a, b) => a - b);

  let longestStreak = 0;
  let run = 0;
  let prev: number | null = null;
  for (const day of sortedDays) {
    run = prev !== null && day === prev + 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    prev = day;
  }

  // The streak stays alive if the last watch was today or yesterday
  const today = dayIndex(now);
  let currentStreak = 0;
  let cursor = daysSet.has(today) ? today : today - 1;
  while (daysSet.has(cursor)) {
    currentStreak++;
    cursor--;
  }

  const daysElapsed = today - dayIndex(new Date(year, 0, 1)) + 1;
  const avgPerDay = daysElapsed > 0 ? episodesThisYear / daysElapsed : 0;

  return {
    year,
    episodesThisYear,
    daysWatched: daysSet.size,
    avgPerDay,
    currentStreak,
    longestStreak,
    bestDay,
    bestMonth,
  };
}

export function groupEpisodesByTrend(
  logs: EpisodeLog[],
  periodType: 'l7d' | 'l8w' | 'ly'
): TrendDataPoint[] {
  if (!logs.length) return [];

  // Filter logs to only include valid watched_at dates
  const validLogs = logs.filter(log => log.watched_at);
  if (!validLogs.length) return [];

  // Use local date boundaries (not UTC) since logs are stored by local date
  const now = new Date();
  const startDate = new Date();

  // Determine start date based on period
  if (periodType === 'l7d') startDate.setDate(now.getDate() - 7);
  else if (periodType === 'l8w') startDate.setDate(now.getDate() - 56); // 8 weeks
  else startDate.setFullYear(now.getFullYear() - 1); // ly - last year

  // Set start to beginning of day, end to end of day (local time)
  startDate.setHours(0, 0, 0, 0);
  now.setHours(23, 59, 59, 999);

  // Filter logs within the period
  const periodLogs = validLogs.filter(log => {
    const logDate = new Date(log.watched_at!);
    return logDate >= startDate && logDate <= now;
  });

  if (periodType === 'l7d') {
    return groupByDay(periodLogs, startDate, now);
  } else if (periodType === 'l8w') {
    return groupByWeek(periodLogs, startDate, now);
  } else {
    return groupByMonth(periodLogs, startDate, now);
  }
}

function groupByDay(logs: EpisodeLog[], startDate: Date, endDate: Date): TrendDataPoint[] {
  const grouped: Record<string, number> = {};

  // Initialize all days with 0
  const current = new Date(startDate);
  while (current <= endDate) {
    const key = current.toISOString().split('T')[0];
    grouped[key] = 0;
    current.setDate(current.getDate() + 1);
  }

  // Count episodes for each day
  logs.forEach(log => {
    const logDate = new Date(log.watched_at!);
    const key = logDate.toISOString().split('T')[0];
    if (key in grouped) {
      grouped[key]++;
    }
  });

  // Convert to sorted array with short labels (e.g., "Mon", "Tue")
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Object.entries(grouped).map(([dateStr, count]) => {
    const date = new Date(dateStr);
    return {
      label: dayNames[date.getDay()],
      count,
    };
  });
}

function groupByWeek(logs: EpisodeLog[], startDate: Date, endDate: Date): TrendDataPoint[] {
  const grouped: Record<number, number> = {};

  // Initialize 8 weeks with 0
  for (let i = 0; i < 8; i++) {
    grouped[i] = 0;
  }

  // Count episodes per week
  logs.forEach(log => {
    const logDate = new Date(log.watched_at!);
    const weeksDiff = Math.floor((endDate.getTime() - logDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (weeksDiff >= 0 && weeksDiff < 8) {
      grouped[7 - weeksDiff]++;
    }
  });

  // Convert to labels
  return Object.entries(grouped).map(([_, count], index) => {
    return {
      label: `W${index + 1}`,
      count,
    };
  });
}

function groupByMonth(logs: EpisodeLog[], startDate: Date, endDate: Date): TrendDataPoint[] {
  const grouped: Record<string, number> = {};

  // Initialize months (always use 1st of month to avoid date overflow issues)
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  while (current <= endDate) {
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    grouped[key] = 0;
    current.setMonth(current.getMonth() + 1);
  }

  // Count episodes per month
  logs.forEach(log => {
    const logDate = new Date(log.watched_at!);
    const key = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}`;
    if (key in grouped) {
      grouped[key]++;
    }
  });

  // Convert to labels (e.g., "Jan", "Feb")
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return Object.entries(grouped).map(([dateStr, count]) => {
    const [, monthStr] = dateStr.split('-');
    const monthNum = parseInt(monthStr, 10) - 1;
    return {
      label: monthNames[monthNum],
      count,
    };
  });
}
