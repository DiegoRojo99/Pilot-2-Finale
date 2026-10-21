import { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthGate } from '@/components/auth/auth-gate';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getStats } from '@/lib/episodes';
import type { EpisodeStatsPeriod, EpisodeStatsResponse } from '@/types/episode';
import { StatsLoadingState, StatsErrorState, StatsEmptyState } from '@/components/stats';
import {
  OverviewStatsSection,
  TimeSpentSection,
  PendingSection,
  FooterNoteSection,
  EpisodesTrendSection,
  YearDashboardSection,
} from '@/components/stats/sections';

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
      <YearDashboardSection />
      <OverviewStatsSection stats={stats} />
      <EpisodesTrendSection />
      <TimeSpentSection stats={stats} period={period} setPeriod={setPeriod} formatMinutes={formatMinutes} />
      <PendingSection stats={stats} formatMinutes={formatMinutes} />
      <FooterNoteSection />
    </ScrollView>
  );
}

export default function StatsScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={{ fontSize: 28, fontWeight: '800' }}>
            Stats
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Your watching journey in numbers
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
    marginBottom: Spacing.md,
  },
  content: {
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
});
