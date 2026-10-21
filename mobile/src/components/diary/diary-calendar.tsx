import { useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { EpisodeLog } from '@/types/episode';

interface DiaryCalendarProps {
  logs: EpisodeLog[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

export function DiaryCalendar({
  logs,
  selectedDate,
  onSelectDate,
}: DiaryCalendarProps) {
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Build a map of dates to episode counts
  const logsByDate = useMemo(() => {
    const map = new Map<string, EpisodeLog[]>();
    for (const log of logs) {
      if (!log.watched_at) continue;
      const dateKey = log.watched_at.slice(0, 10);
      const existing = map.get(dateKey) ?? [];
      existing.push(log);
      map.set(dateKey, existing);
    }
    return map;
  }, [logs]);

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of month and number of days in month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      day: number;
      isCurrentMonth: boolean;
      dateKey: string;
    }> = [];

    // Previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        dateKey: '',
      });
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(year, month, i);
      const dateKey = dateObj.toISOString().split('T')[0];
      days.push({
        day: i,
        isCurrentMonth: true,
        dateKey,
      });
    }

    // Next month's days
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        dateKey: '',
      });
    }

    return days;
  }, [currentMonth]);

  const monthYear = currentMonth.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
      {/* Month Navigation */}
      <View style={styles.monthHeader}>
        <TouchableOpacity
          onPress={handlePrevMonth}
          style={[styles.monthButton, { borderColor: theme.border }]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.monthYear}>
          {monthYear}
        </ThemedText>
        <TouchableOpacity
          onPress={handleNextMonth}
          style={[styles.monthButton, { borderColor: theme.border }]}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View style={styles.weekHeader}>
        {weekDays.map((day) => (
          <ThemedText
            key={day}
            type="xs"
            style={[styles.dayHeaderText, { color: theme.textSecondary, fontWeight: '600' }]}
          >
            {day}
          </ThemedText>
        ))}
      </View>

      {/* Calendar Days */}
      <View style={styles.daysGrid}>
        {calendarDays.map((dayObj, idx) => {
          const episodeCount = dayObj.isCurrentMonth
            ? logsByDate.get(dayObj.dateKey)?.length ?? 0
            : 0;
          const isSelected = selectedDate === dayObj.dateKey;
          const hasLogs = episodeCount > 0;

          return (
            <TouchableOpacity
              key={idx}
              disabled={!dayObj.isCurrentMonth}
              onPress={() => {
                if (dayObj.isCurrentMonth && dayObj.dateKey) {
                  onSelectDate(isSelected ? null : dayObj.dateKey);
                }
              }}
              style={[
                styles.dayCell,
                {
                  backgroundColor: isSelected
                    ? theme.accent
                    : hasLogs
                      ? theme.backgroundSelected
                      : 'transparent',
                },
              ]}
            >
              <ThemedText
                type="xs"
                style={[
                  styles.dayText,
                  {
                    color:
                      isSelected || hasLogs
                        ? theme.text
                        : dayObj.isCurrentMonth
                          ? theme.textSecondary
                          : theme.backgroundSelected,
                    fontWeight: '500',
                  },
                ]}
              >
                {dayObj.day}
              </ThemedText>
              {hasLogs && (
                <ThemedText
                  type="xxs"
                  style={[
                    styles.countText,
                    {
                      color:
                        isSelected || hasLogs
                          ? theme.text
                          : theme.textSecondary,
                    },
                  ]}
                >
                  {episodeCount > 9 ? '9+' : episodeCount}
                </ThemedText>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedDate && (
        <TouchableOpacity
          onPress={() => onSelectDate(null)}
          style={[styles.clearButton, { backgroundColor: theme.backgroundSelected }]}
        >
          <ThemedText type="xs" style={[styles.clearButtonText, { fontWeight: '500' }]}>
            Clear selection
          </ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: 12,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  monthButton: {
    padding: Spacing.md,
    borderRadius: 8,
  },
  monthYear: {
    fontSize: 16,
    fontWeight: '600',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    paddingVertical: Spacing.sm,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
  },
  dayCell: {
    width: '12.28%',
    paddingVertical: Spacing.xs,
    marginHorizontal: '1%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  countText: {
    fontSize: 10,
    marginTop: 2,
  },
  clearButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
