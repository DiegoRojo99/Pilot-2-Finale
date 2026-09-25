import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { StatRow } from './StatRow';
import type { EpisodeStatsResponse } from '@/types/episode';

export function BasicStatsSection({ stats }: { stats: EpisodeStatsResponse }) {
  return (
    <View style={styles.section}>
      <ThemedText type="small" style={styles.sectionTitle}>
        BASIC STATS
      </ThemedText>
      <View style={styles.statsGrid}>
        <StatRow label="Episodes Watched" value={stats.totalEpisodes} />
        <StatRow label="Total Shows" value={stats.totalShows} />
        <StatRow label="Currently Watching" value={stats.watchingShows} />
        <StatRow label="Completed" value={stats.watchedShows} />
        <StatRow label="Watchlist" value={stats.wantToWatch} />
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
});
