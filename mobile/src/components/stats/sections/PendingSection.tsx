import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { StatRow } from './StatRow';
import { useTheme } from '@/hooks/use-theme';
import type { EpisodeStatsResponse } from '@/types/episode';

export function PendingSection({
  stats,
  formatMinutes,
}: {
  stats: EpisodeStatsResponse;
  formatMinutes: (minutes: number) => string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <ThemedText type="small" style={styles.sectionTitle}>
        PENDING (WATCHING)
      </ThemedText>
      <View style={styles.statsGrid}>
        <StatRow label="Episodes Left" value={stats.pendingEpisodesWatching} />
        <View style={[styles.statRow, { borderColor: theme.border }]}>
          <ThemedText type="small">Estimated Time Left</ThemedText>
          <ThemedText type="subtitle" style={{ fontWeight: '700' }}>
            {formatMinutes(stats.pendingRuntimeMinutesWatching)}
          </ThemedText>
        </View>
      </View>
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
  statsGrid: {
    gap: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.two,
  },
});
