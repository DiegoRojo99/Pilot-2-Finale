import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DiaryEntryList } from '@/components/diary';

type DiaryDay = {
  date: string;
  entries: any[];
};

function getRelativeDate(dateStr: string): string {
  // dateStr is already formatted like "Fri, Sep 11, 2026"
  // Parse it to compare with today
  const entryDate = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Normalize dates to compare only the day part
  const entryDateNorm = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayNorm = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (entryDateNorm.getTime() === todayNorm.getTime()) return `Today - ${dateStr}`;
  else if (entryDateNorm.getTime() === yesterdayNorm.getTime()) return `Yesterday - ${dateStr}`;
  return dateStr;
}

export function DiaryDayItem({ day }: { day: DiaryDay }) {
    const theme = useTheme();
    const { date, entries } = day;
    const displayDate = getRelativeDate(date);

    return (
        <View key={date}>
            {/* Date Separator */}
            <View style={[styles.dateSeparator, { backgroundColor: theme.background }]}>
                <ThemedText
                type="subtitle"
                style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: theme.text,
                }}
                >
                    {displayDate}
                </ThemedText>
            </View>

            {/* Entries for this day */}
            {entries.map((entry) => (
                <DiaryEntryList key={entry.id} entry={entry} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
  dateSeparator: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
});