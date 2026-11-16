import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthGate } from '@/components/auth/auth-gate';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getUpcomingEpisodes } from '@/lib/episodes';
import type { UpcomingEpisode } from '@/types/episode';

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function CalendarContent() {
  const theme = useTheme();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<UpcomingEpisode[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async (refresh = false) => {
    const id = ++requestId.current;
    if (refresh) setRefreshing(true);
    try {
      const data = await getUpcomingEpisodes();
      if (id !== requestId.current) return;
      setEpisodes(data.episodes);
      setStatus('success');
    } catch {
      if (id === requestId.current) setStatus('error');
    } finally {
      if (id === requestId.current) setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestId.current += 1; };
  }, [load]));

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthPrefix = dateKey(year, monthIndex, 1).slice(0, 7);
  const monthEpisodes = episodes.filter((episode) => episode.airDate.slice(0, 7) === monthPrefix)
    .sort((a, b) => a.airDate.localeCompare(b.airDate));
  const counts = new Map<string, number>();
  for (const episode of monthEpisodes) {
    const key = episode.airDate.slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const today = new Date().toISOString().slice(0, 10);
  const visibleEpisodes = selectedDate
    ? monthEpisodes.filter((episode) => episode.airDate.slice(0, 10) === selectedDate)
    : monthEpisodes;

  function changeMonth(offset: number) {
    setMonth(new Date(year, monthIndex + offset, 1));
    setSelectedDate(null);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}>
      {status === 'loading' ? (
        <Card style={styles.center}><ActivityIndicator color={theme.accent} /><ThemedText>Loading upcoming episodes...</ThemedText></Card>
      ) : status === 'error' ? (
        <Card>
          <ThemedText type="subtitle">Could not load upcoming episodes</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Check your connection and try again.</ThemedText>
          <Button label="Try again" onPress={() => void load()} />
        </Card>
      ) : (
        <>
          <Card>
            <View style={styles.monthHeader}>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => changeMonth(-1)} style={styles.monthButton}>
                <Ionicons name="chevron-back" size={22} color={theme.text} />
              </Pressable>
              <ThemedText type="subtitle">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</ThemedText>
              <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => changeMonth(1)} style={styles.monthButton}>
                <Ionicons name="chevron-forward" size={22} color={theme.text} />
              </Pressable>
            </View>
            <View style={styles.grid}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <ThemedText key={day} type="xs" themeColor="textSecondary" style={styles.weekday}>{day}</ThemedText>
              ))}
              {Array.from({ length: firstDay }, (_, index) => <View key={`empty-${index}`} style={styles.day} />)}
              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1;
                const key = dateKey(year, monthIndex, day);
                const count = counts.get(key) ?? 0;
                const selected = key === selectedDate;
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityLabel={`${key}${key === today ? ', today' : ''}, ${count} upcoming ${count === 1 ? 'episode' : 'episodes'}`}
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedDate(selected ? null : key)}
                    style={[styles.day, {
                      backgroundColor: selected ? theme.accent : count ? theme.backgroundSelected : 'transparent',
                      borderWidth: key === today ? 1 : 0,
                      borderColor: theme.accent,
                    }]}>
                    <ThemedText type="small" style={{ color: selected ? theme.accentText : theme.text }}>{day}</ThemedText>
                    {count > 0 && <ThemedText type="xxs" style={{ color: selected ? theme.accentText : theme.textSecondary }}>{count}</ThemedText>}
                  </Pressable>
                );
              })}
            </View>
          </Card>
          <ThemedText type="subtitle">{selectedDate ? `Episodes on ${selectedDate}` : 'This month'}</ThemedText>
          {visibleEpisodes.length === 0 ? (
            <Card><ThemedText type="small" themeColor="textSecondary">No known upcoming episodes for {selectedDate ? 'this date' : 'this month'}.</ThemedText></Card>
          ) : visibleEpisodes.map((episode) => (
            <Pressable
              key={episode.id}
              accessibilityRole="button"
              accessibilityLabel={`View ${episode.showName}, season ${episode.seasonNumber}, episode ${episode.episodeNumber}`}
              onPress={() => router.push(`/show/${episode.showId}/season/${episode.seasonNumber}/episode/${episode.episodeNumber}`)}>
              <Card>
                <ThemedText type="smallBold">{episode.showName}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {episode.airDate.slice(0, 10)} · S{String(episode.seasonNumber).padStart(2, '0')} E{String(episode.episodeNumber).padStart(2, '0')} · {episode.title}
                </ThemedText>
              </Card>
            </Pressable>
          ))}
          <ThemedText type="small" themeColor="textSecondary">
            Air dates are date-only and may change. Today is based on UTC. Episodes without a known date or not yet in the catalog are not shown.
          </ThemedText>
        </>
      )}
    </ScrollView>
  );
}

export default function CalendarScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <ThemedText type="title">Calendar</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">Upcoming episodes from all your shows.</ThemedText>
      </View>
      <AuthGate title="Sign in to view your calendar" description="Your upcoming episodes are based on your tracked shows.">
        <CalendarContent />
      </AuthGate>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  header: { paddingVertical: Spacing.lg, gap: Spacing.one },
  content: { gap: Spacing.three, paddingBottom: Spacing.lg, flexGrow: 1 },
  center: { alignItems: 'center' },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.2857%', textAlign: 'center', paddingVertical: Spacing.two },
  day: { width: '14.2857%', minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: Spacing.two },
});
