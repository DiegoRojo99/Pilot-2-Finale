import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { EpisodeStatsResponse } from '@/types/episode';
import { StatGridCell } from './StatGridCell';

export function OverviewStatsSection({ stats }: { stats: EpisodeStatsResponse }) {
  return (
    <View style={styles.section}>
      <ThemedText type="small" style={styles.sectionTitle}>
        OVERVIEW STATS
      </ThemedText>
      <View style={styles.statsGrid}>
        <StatGridCell labelTop="WATCHED" labelBottom="Episodes" value={stats.totalEpisodes} />
        <StatGridCell labelTop="SHOWS" labelBottom="Total" value={stats.totalShows} />
        <StatGridCell labelTop="WATCHING" labelBottom="Shows" value={stats.watchingShows} />
        <StatGridCell labelTop="COMPLETED" labelBottom="Shows" value={stats.watchedShows} />
        {/* <StatGridCell labelTop="WATCHLIST" labelBottom="Shows" value={stats.wantToWatch} /> */}
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
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
});
