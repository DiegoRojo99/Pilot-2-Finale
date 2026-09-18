import { useState, useCallback } from 'react';
import { View, RefreshControl, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthGate } from '@/components/auth/auth-gate';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DiaryEntryList, DiaryEmptyState, DiaryLoadingState, DiaryErrorState } from '@/components/diary';
import { getAllEpisodeLogs } from '@/lib/episodes';
import type { EpisodeLog } from '@/types/episode';

interface DiaryDay {
  date: string;
  entries: EpisodeLog[];
}

function AuthenticatedDiary() {
  const theme = useTheme();
  const [entries, setEntries] = useState<EpisodeLog[]>([]);
  const [days, setDays] = useState<DiaryDay[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDiary = useCallback(async () => {
    try {
      const logs = await getAllEpisodeLogs(100);
      setEntries(logs);
      groupEntriesByDay(logs);
      setStatus('success');
    } catch (error) {
      setStatus('error');
    }
  }, []);

  const groupEntriesByDay = (logs: EpisodeLog[]) => {
    const grouped: Record<string, EpisodeLog[]> = {};

    logs.forEach((entry) => {
      const date = entry.watched_at
        ? new Date(entry.watched_at).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'Unknown Date';

      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(entry);
    });

    const dayArray: DiaryDay[] = Object.entries(grouped)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
      .map(([date, data]) => ({
        date,
        entries: data,
      }));

    setDays(dayArray);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchDiary();
    } finally {
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (status === 'loading') void fetchDiary();
    }, [status, fetchDiary])
  );

  if (status === 'loading') return <DiaryLoadingState label="Loading your diary..." />;
  if (status === 'error') return <DiaryErrorState />;
  if (entries.length === 0) {
    return (
      <DiaryEmptyState
        title="Your diary is empty"
        description="Start watching episodes and log them here to keep track of your viewing journey."
      />
    );
  }

  return (
    <>
      <FlatList
        data={days}
        renderItem={({ item: day }) => (
          <View key={day.date}>
            {/* Date Separator */}
            <View
              style={{
                paddingVertical: Spacing.md,
                paddingHorizontal: Spacing.lg,
                backgroundColor: theme.backgroundElement,
              }}
            >
              <ThemedText
                type="subtitle"
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: theme.accent,
                }}
              >
                {day.date}
              </ThemedText>
            </View>

            {/* Entries for this day */}
            {day.entries.map((entry) => (
              <DiaryEntryList key={entry.id} entry={entry} />
            ))}
          </View>
        )}
        keyExtractor={(item) => item.date}
        scrollEnabled={true}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.accent} />}
      />
    </>
  );
}

export default function DiaryScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ThemedView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <ThemedText type="title" style={{ fontSize: 28, fontWeight: '800' }}>
            My Diary
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Your episode watching journey
          </ThemedText>
        </View>

        <AuthGate
          title="Sign in to view diary"
          description="Your watched episodes and notes are private to your account."
        >
          <AuthenticatedDiary />
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
  },
});
