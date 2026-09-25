import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { EpisodeStatsPeriod, EpisodeStatsResponse } from '@/types/episode';

const PERIOD_OPTIONS: Array<{ value: EpisodeStatsPeriod; label: string }> = [
  { value: 'l7d', label: 'L7D' },
  { value: 'l30d', label: 'L30D' },
  { value: 'ly', label: 'LY' },
];

export function TimeSpentSection({
  stats,
  period,
  setPeriod,
  formatMinutes,
}: {
  stats: EpisodeStatsResponse;
  period: EpisodeStatsPeriod;
  setPeriod: (period: EpisodeStatsPeriod) => void;
  formatMinutes: (minutes: number) => string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <ThemedText type="small" style={styles.sectionTitle}>
        TIME SPENT WATCHING
      </ThemedText>
      <Card>
        <View style={styles.periodButtons}>
          {PERIOD_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setPeriod(option.value)}
              style={[
                styles.periodButton,
                {
                  backgroundColor:
                    period === option.value ? theme.accent : theme.backgroundSelected,
                },
              ]}
            >
              <ThemedText
                type="small"
                themeColor={period === option.value ? 'accentText' : 'text'}
                style={{ fontWeight: '600' }}
              >
                {option.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
        <View style={[styles.statsCard, { borderColor: theme.border }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Total runtime watched
          </ThemedText>
          <ThemedText type="title" style={{ marginTop: Spacing.sm }}>
            {formatMinutes(stats.timeSpentMinutes)}
          </ThemedText>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  periodButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  statsCard: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.two,
  },
});
