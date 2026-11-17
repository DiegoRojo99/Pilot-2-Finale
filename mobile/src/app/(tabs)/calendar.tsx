import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthGate } from '@/components/auth/auth-gate';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getUpcomingEpisodes } from '@/lib/episodes';
import { groupCalendarEpisodes } from '@/lib/calendar';
import { getBackdropUrl, getPosterUrl, getStillUrl } from '@/lib/tmdb-images';
import type { UpcomingEpisode } from '@/types/episode';

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDate(date: string, options: Intl.DateTimeFormatOptions) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, { ...options, timeZone: 'UTC' });
}

const DAY_WIDTH = 52;
const DAY_GAP = Spacing.two;

function CalendarContent() {
  const theme = useTheme();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(() => new Date().toISOString().slice(0, 10));
  const [episodes, setEpisodes] = useState<UpcomingEpisode[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);
  const agendaRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const sectionOffsets = useRef(new Map<string, number>());
  const pendingDate = useRef<string | null>(null);

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
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthPrefix = dateKey(year, monthIndex, 1).slice(0, 7);
  const groups = groupCalendarEpisodes(episodes, monthPrefix, selectedDate);
  const days = Array.from({ length: daysInMonth }, (_, index) => dateKey(year, monthIndex, index + 1));
  const today = new Date().toISOString().slice(0, 10);
  const initialDayIndex = today.startsWith(`${monthPrefix}-`) ? Number(today.slice(8, 10)) - 1 : 0;

  function selectDay(date: string) {
    pendingDate.current = date;
    setSelectedDate(date);
    const removingEmptyDate = selectedDate !== null && selectedDate !== date
      && !episodes.some((episode) => episode.airDate.slice(0, 10) === selectedDate);
    const offset = groups.some((group) => group.date === date) ? sectionOffsets.current.get(date) : undefined;
    if (offset !== undefined && !removingEmptyDate) {
      agendaRef.current?.scrollTo({ y: offset, animated: true });
      pendingDate.current = null;
    }
  }

  function scrollToPendingDate() {
    if (!pendingDate.current) return;
    const offset = sectionOffsets.current.get(pendingDate.current);
    if (offset === undefined) return;
    agendaRef.current?.scrollTo({ y: offset, animated: true });
    pendingDate.current = null;
  }

  function changeMonth(offset: number) {
    sectionOffsets.current.clear();
    pendingDate.current = null;
    setMonth(new Date(year, monthIndex + offset, 1));
    setSelectedDate(null);
    agendaRef.current?.scrollTo({ y: 0, animated: false });
  }

  return (
    <View style={styles.body}>
      <View style={styles.monthHeader}>
        <ThemedText type="subtitle">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</ThemedText>
        <View style={styles.monthActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => changeMonth(-1)} style={styles.monthButton}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => changeMonth(1)} style={styles.monthButton}>
            <Ionicons name="chevron-forward" size={20} color={theme.text} />
          </Pressable>
        </View>
      </View>
      <FlatList
        key={monthPrefix}
        horizontal
        style={styles.dayStrip}
        contentContainerStyle={styles.days}
        showsHorizontalScrollIndicator={false}
        data={days}
        extraData={{ selectedDate, episodes }}
        keyExtractor={(date) => date}
        initialScrollIndex={initialDayIndex}
        getItemLayout={(_, index) => ({ length: DAY_WIDTH + DAY_GAP, offset: (DAY_WIDTH + DAY_GAP) * index, index })}
        renderItem={({ item: date }) => {
          const count = groups.find((group) => group.date === date)?.episodes.length ?? 0;
          const selected = date === selectedDate;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}${date === today ? ', today' : ''}, ${count} upcoming ${count === 1 ? 'episode' : 'episodes'}`}
              accessibilityState={{ selected }}
              onPress={() => selectDay(date)}
              style={[styles.day, {
                backgroundColor: selected ? theme.accent : theme.backgroundElement,
                borderColor: date === today ? theme.accent : 'transparent',
              }]}>
              <ThemedText type="xs" style={{ color: selected ? theme.accentText : theme.textSecondary }}>
                {formatDate(date, { weekday: 'short' })}
              </ThemedText>
              <ThemedText type="smallBold" style={{ color: selected ? theme.accentText : theme.text }}>
                {Number(date.slice(8, 10))}
              </ThemedText>
              <View style={[styles.dot, { backgroundColor: count ? selected ? theme.accentText : theme.accent : 'transparent' }]} />
            </Pressable>
          );
        }}
      />
      <ScrollView
        ref={agendaRef}
        style={styles.body}
        contentContainerStyle={styles.content}
        onContentSizeChange={scrollToPendingDate}
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
            {groups.length === 0 ? (
              <Card><ThemedText type="small" themeColor="textSecondary">No known upcoming episodes this month.</ThemedText></Card>
            ) : groups.map((group) => (
              <View
                key={group.date}
                style={styles.dateGroup}
                onLayout={({ nativeEvent }) => {
                  sectionOffsets.current.set(group.date, nativeEvent.layout.y);
                  if (pendingDate.current === group.date) {
                    agendaRef.current?.scrollTo({ y: nativeEvent.layout.y, animated: true });
                    pendingDate.current = null;
                  }
                }}>
                <View style={styles.dateHeader}>
                  <ThemedText type="smallBold" accessibilityRole="header">
                    {group.date === today ? 'Today' : formatDate(group.date, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </ThemedText>
                  <ThemedText type="xs" themeColor="textSecondary">
                    {group.episodes.length} {group.episodes.length === 1 ? 'episode' : 'episodes'}
                  </ThemedText>
                </View>
                {group.episodes.length === 0 ? (
                  <Card><ThemedText type="small" themeColor="textSecondary">No known upcoming episodes for this date.</ThemedText></Card>
                ) : group.episodes.map((episode) => <CalendarEpisodeCard key={episode.id} episode={episode} />)}
              </View>
            ))}
            <ThemedText type="small" themeColor="textSecondary">
              Air dates are date-only and may change. Today is based on UTC. Episodes without a known date or not yet in the catalog are not shown.
            </ThemedText>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function CalendarEpisodeCard({ episode }: { episode: UpcomingEpisode }) {
  const theme = useTheme();
  const image = getStillUrl(episode.stillPath)
    ?? getBackdropUrl(episode.showBackdropPath)
    ?? getPosterUrl(episode.showPosterPath);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${episode.showName}, season ${episode.seasonNumber}, episode ${episode.episodeNumber}, ${episode.title}`}
      onPress={() => router.push(`/show/${episode.showId}/season/${episode.seasonNumber}/episode/${episode.episodeNumber}`)}
      style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.episodeCard}>
        {image ? (
          <Image source={{ uri: image }} style={styles.episodeImage} contentFit="cover" alt="" accessibilityIgnoresInvertColors />
        ) : (
          <View style={[styles.episodeImage, styles.center, { backgroundColor: theme.backgroundSelected }]}>
            <Ionicons name="tv-outline" size={28} color={theme.textSecondary} />
          </View>
        )}
        <View style={styles.episodeInfo}>
          <ThemedText type="smallBold" numberOfLines={2}>{episode.showName}</ThemedText>
          <ThemedText type="xs" style={{ color: theme.accent }}>
            Season {episode.seasonNumber} · Episode {episode.episodeNumber}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>{episode.title}</ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} style={styles.episodeChevron} />
      </Card>
    </Pressable>
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
  body: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthActions: { flexDirection: 'row' },
  monthButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  dayStrip: { flexGrow: 0 },
  days: { gap: DAY_GAP, paddingTop: Spacing.two, paddingBottom: Spacing.four },
  day: { width: DAY_WIDTH, minHeight: 80, paddingVertical: Spacing.two, gap: Spacing.one, alignItems: 'center', justifyContent: 'center', borderRadius: Spacing.three, borderWidth: 1 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  dateGroup: { gap: Spacing.two },
  dateHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, paddingVertical: Spacing.two },
  episodeCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: 0, overflow: 'hidden' },
  episodeImage: { width: 100, height: 112 },
  episodeInfo: { flex: 1, gap: Spacing.one, paddingVertical: Spacing.two },
  episodeChevron: { marginRight: Spacing.two },
  pressed: { opacity: 0.75 },
});
