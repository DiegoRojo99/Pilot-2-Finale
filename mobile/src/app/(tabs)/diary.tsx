import { useState, useCallback, useEffect } from 'react';
import { View, RefreshControl, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthGate } from '@/components/auth/auth-gate';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DiaryEmptyState, DiaryLoadingState, DiaryErrorState } from '@/components/diary';
import { DiaryCalendar } from '@/components/diary/diary-calendar';
import { TabBar } from '@/components/ui/tab-bar';
import { getAllEpisodeLogs } from '@/lib/episodes';
import type { EpisodeLog } from '@/types/episode';
import { DiaryDayItem } from '@/components/diary/diary-day-item';

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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
    const logsToProcess = selectedDate
      ? logs.filter((log) => log.watched_at?.startsWith(selectedDate))
      : logs;

    const grouped: Record<string, EpisodeLog[]> = {};

    logsToProcess.forEach((entry) => {
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
    try { await fetchDiary(); } 
    finally { setIsRefreshing(false); }
  };

  // Re-group entries when selectedDate changes
  useEffect(() => {
    groupEntriesByDay(entries);
  }, [selectedDate]);

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
    <FlatList
      ListHeaderComponent={
        <>
          <View style={styles.tabsWrapper}>
            <TabBar
              tabs={[
                { id: 'list', label: 'List', icon: 'list' },
                { id: 'calendar', label: 'Calendar', icon: 'calendar' },
              ]}
              activeTab={viewMode}
              onTabChange={(tabId) => {
                setViewMode(tabId as 'list' | 'calendar');
                if (tabId === 'list') setSelectedDate(null);
              }}
            />
          </View>
          {viewMode === 'calendar' && (
            <View>
              <DiaryCalendar logs={entries} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            </View>
          )}
        </>
      }
      data={days}
      renderItem={({ item: day }) => (
        <View>
          <DiaryDayItem day={day} onEntryUpdated={() => void fetchDiary()} />
        </View>
      )}
      keyExtractor={(item) => item.date}
      scrollEnabled={true}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.accent} />}
      contentContainerStyle={
        viewMode === 'calendar' && selectedDate === null && days.length === 0
          ? { flexGrow: 1 }
          : undefined
      }
    />
  );
}

export default function DiaryScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.scrollView, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <AuthGate
          title="Sign in to view diary"
          description="Your watched episodes and notes are private to your account."
        >
          <AuthenticatedDiary />
        </AuthGate>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  tabsWrapper: {
    marginHorizontal: -Spacing.lg,
  },
});
