import { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthGate } from '@/components/auth/auth-gate';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getStats } from '@/lib/episodes';
import type { EpisodeStatsPeriod, EpisodeStatsResponse } from '@/types/episode';
import { StatsLoadingState, StatsErrorState, StatsEmptyState } from '@/components/stats';

const PERIOD_OPTIONS: Array<{ value: EpisodeStatsPeriod; label: string }> = [
  { value: 'l7d', label: 'L7D' },
  { value: 'l30d', label: 'L30D' },
  { value: 'ly', label: 'LY' },
];

function StatRow({ label, value }: { label: string; value: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.statRow, { borderColor: theme.border }]}>
      <ThemedText type="small">{label}</ThemedText>
      <ThemedText type="subtitle" style={{ fontWeight: '700' }}>
        {value}
      </ThemedText>
    </View>
  );
}

function AuthenticatedStats() {
  const theme = useTheme();
  const [period, setPeriod] = useState<EpisodeStatsPeriod>('l30d');
  const [stats, setStats] = useState<EpisodeStatsResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getStats(period);
      setStats(data);
      setStatus('success');
    } catch (error) {
      setStatus('error');
    }
  }, [period]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchStats();
    } finally {
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void fetchStats();
    }, [fetchStats])
  );

  const formatMinutes = (minutes: number) => {
    if (minutes <= 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;

    if (hours <= 0) return `${remMinutes}m`;
    if (remMinutes === 0) return `${hours}h`;
    return `${hours}h ${remMinutes}m`;
  };

  if (status === 'loading') return <StatsLoadingState label="Loading your stats..." />;
  if (status === 'error') return <StatsErrorState />;
  if (!stats) return <StatsEmptyState />;

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.accent} />}
      contentContainerStyle={styles.content}
    >
      {/* Basic Stats Section */}
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

      {/* Time Spent Section */}
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

      {/* Pending Section */}
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

      {/* Footer Note */}
      <View style={[styles.section, { marginBottom: Spacing['2xl'] }]}>
        <ThemedView type="backgroundSelected" style={styles.note}>
          <ThemedText type="small" themeColor="textSecondary">
            More insights coming soon! Keep tracking your viewing journey.
          </ThemedText>
        </ThemedView>
      </View>
    </ScrollView>
  );
}

export default function StatsScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ThemedView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <ThemedText type="title" style={{ fontSize: 28, fontWeight: '800' }}>
            My Stats
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Your episode watching journey
          </ThemedText>
        </View>

        <AuthGate
          title="Sign in to view stats"
          description="Your watched episodes and statistics are private to your account."
        >
          <AuthenticatedStats />
        </AuthGate>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    marginBottom: Spacing.lg,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
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
  note: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
});
