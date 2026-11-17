import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthGate } from '@/components/auth/auth-gate';
import { UserShowCard } from '@/components/show/user-show-card';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Spacing } from '@/constants/theme';
import { SHOW_STATUS_COLORS } from '@/constants/show-status';
import { useTheme } from '@/hooks/use-theme';
import { getMyShows } from '@/lib/shows';
import { getPosterUrl, getYear } from '@/lib/tmdb-images';
import { getLibraryProgress } from '@/lib/show-library';
import { STATUS_LABELS, type ShowStatus, type UserShow } from '@/types/api';

type Mode = 'up-next' | 'library';
type Filter = ShowStatus | 'all';
const filters: Filter[] = ['all', 'watching', 'want_to_watch', 'watched', 'on_hold', 'dropped'];

function LibraryContent({ mode }: { mode: Mode }) {
  const theme = useTheme();
  const [shows, setShows] = useState<UserShow[]>([]);
  const [filter, setFilter] = useState<Filter>('watching');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async (refresh = false) => {
    const id = ++requestId.current;
    if (refresh) setRefreshing(true);
    try {
      const data = await getMyShows();
      if (id !== requestId.current) return;
      setShows(data);
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

  const visibleShows = shows.filter((show) =>
    mode === 'up-next' ? show.status === 'watching' : filter === 'all' || show.status === filter,
  );
  const counts: Record<Filter, number> = { all: shows.length, watching: 0, want_to_watch: 0, watched: 0, on_hold: 0, dropped: 0 };
  for (const show of shows) counts[show.status] += 1;

  return (
    <View style={styles.body}>
      {mode === 'library' && (
        <ScrollView horizontal style={styles.filterScroll} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`${item === 'all' ? 'All' : STATUS_LABELS[item]}${status === 'success' ? `, ${counts[item]} shows` : ''}`}
              accessibilityState={{ selected: filter === item }}
              onPress={() => setFilter(item)}
              style={[styles.filter, { backgroundColor: filter === item ? theme.accent : theme.backgroundElement }]}>
              <ThemedText type="small" style={{ color: filter === item ? theme.accentText : theme.text }}>
                {item === 'all' ? 'All' : STATUS_LABELS[item]}
              </ThemedText>
              {status === 'success' && (
                <ThemedText type="xxs" style={[styles.filterCount, { color: filter === item ? theme.accentText : theme.textSecondary }]}>
                  {counts[item]}
                </ThemedText>
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}>
        {status === 'loading' ? (
          mode === 'up-next' ? (
            <View accessible accessibilityLabel="Loading your shows" accessibilityState={{ busy: true }} style={styles.skeletonList}>
              {Array.from({ length: 5 }, (_, index) => (
                <Card key={index} style={styles.skeletonCard}>
                  <Skeleton style={styles.skeletonPoster} />
                  <View style={styles.skeletonInfo}>
                    <Skeleton style={styles.skeletonTitle} />
                    <Skeleton style={styles.skeletonEpisode} />
                    <View style={styles.skeletonDetails}>
                      <Skeleton style={styles.skeletonName} />
                      <Skeleton style={styles.skeletonAction} />
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <View accessible accessibilityLabel="Loading your shows" accessibilityState={{ busy: true }} style={styles.skeletonList}>
              {Array.from({ length: 5 }, (_, index) => (
                <Card key={index} style={styles.showCard}>
                  <Skeleton style={styles.poster} />
                  <View style={styles.showInfo}>
                    <View style={styles.showHeading}>
                      <Skeleton style={styles.skeletonLibraryTitle} />
                      <Skeleton style={styles.skeletonBadge} />
                    </View>
                    <Skeleton style={styles.skeletonMetadata} />
                    <View style={styles.progress}>
                      <View style={styles.progressLabels}>
                        <Skeleton style={styles.skeletonProgressLabel} />
                        <Skeleton style={styles.skeletonPercentage} />
                      </View>
                      <Skeleton style={styles.progressTrack} />
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )
        ) : status === 'error' ? (
          <Card>
            <ThemedText type="subtitle">Could not load your shows</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Check your connection and try again.</ThemedText>
            <Button label="Try again" onPress={() => void load()} />
          </Card>
        ) : visibleShows.length === 0 ? (
          <Card>
            <ThemedText type="subtitle">{mode === 'up-next' ? 'Nothing up next' : 'No shows here yet'}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {mode === 'up-next' ? 'Add a show and mark it as Watching to see your next episode.' : 'Try another filter or add a show from Discover.'}
            </ThemedText>
          </Card>
        ) : visibleShows.map((show) => mode === 'up-next'
          ? <UserShowCard key={show.id} show={show} onEpisodeLogged={() => void load()} />
          : <LibraryCard key={show.id} show={show} />)}
      </ScrollView>
    </View>
  );
}

function LibraryCard({ show }: { show: UserShow }) {
  const theme = useTheme();
  const poster = getPosterUrl(show.poster_path);
  const statusColor = SHOW_STATUS_COLORS[show.status];
  const progress = getLibraryProgress(show);
  const metadata = [
    show.first_air_date ? getYear(show.first_air_date) : null,
    show.genres?.map((genre) => genre.name).join(', '),
    show.number_of_seasons > 0 ? `${show.number_of_seasons} ${show.number_of_seasons === 1 ? 'season' : 'seasons'}` : null,
  ].filter(Boolean).join(' · ');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`View ${show.name}`} onPress={() => router.push(`/show/${show.tmdb_id}`)}>
      <Card style={styles.showCard}>
        {poster ? <Image source={{ uri: poster }} style={styles.poster} contentFit="cover" alt={`${show.name} poster`} />
          : <View style={[styles.poster, { backgroundColor: theme.backgroundSelected }]} />}
        <View style={styles.showInfo}>
          <View style={styles.showHeading}>
            <ThemedText type="smallBold" numberOfLines={2} style={styles.showTitle}>{show.name}</ThemedText>
            <ThemedText type="xxs" style={[styles.statusBadge, statusColor]}>{STATUS_LABELS[show.status]}</ThemedText>
          </View>
          {metadata ? <ThemedText type="xs" themeColor="textSecondary" numberOfLines={2}>{metadata}</ThemedText> : null}
          {progress && (
            <View style={styles.progress}>
              <View style={styles.progressLabels}>
                <ThemedText type="xxs" themeColor="textSecondary" numberOfLines={1} style={styles.progressLabel}>
                  {progress.label}
                </ThemedText>
                <ThemedText type="xxs" themeColor="textSecondary">{progress.percentage}%</ThemedText>
              </View>
              <View
                accessibilityRole="progressbar"
                accessibilityLabel={`${show.name} watched progress`}
                accessibilityValue={{ min: 0, max: 100, now: progress.percentage }}
                style={[styles.progressTrack, { backgroundColor: statusColor.backgroundColor }]}>
                <View style={[styles.progressFill, { width: `${progress.percentage}%`, backgroundColor: statusColor.color }]} />
              </View>
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

export function ShowLibraryScreen({ mode }: { mode: Mode }) {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <ThemedText type="title">{mode === 'up-next' ? 'Up Next' : 'My Shows'}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {mode === 'up-next' ? 'Pick up where you left off.' : 'Your shows and watching progress.'}
        </ThemedText>
      </View>
      <AuthGate title="Sign in to view your shows" description="Your watchlist is saved to your account so it can follow you across devices.">
        <LibraryContent mode={mode} />
      </AuthGate>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  header: { paddingVertical: Spacing.lg, gap: Spacing.one },
  body: { flex: 1 },
  filterScroll: { flexGrow: 0 },
  filters: { gap: Spacing.two, paddingBottom: Spacing.three },
  filter: { minHeight: 44, paddingHorizontal: Spacing.three, borderRadius: Spacing.three, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  filterCount: { opacity: 0.7 },
  list: { gap: Spacing.two, paddingBottom: Spacing.lg, flexGrow: 1 },
  skeletonList: { gap: Spacing.two },
  skeletonCard: { flexDirection: 'row', alignItems: 'center', padding: 0, borderRadius: Spacing.three, overflow: 'hidden' },
  skeletonPoster: { width: 68, height: 104 },
  skeletonInfo: { flex: 1, paddingHorizontal: Spacing.three, gap: Spacing.two },
  skeletonTitle: { width: '75%', height: 16, borderRadius: Spacing.one },
  skeletonEpisode: { width: '35%', height: 14, borderRadius: Spacing.one },
  skeletonDetails: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  skeletonName: { flex: 1, height: 14, borderRadius: Spacing.one },
  skeletonAction: { width: 32, height: 32, borderRadius: Spacing.three },
  skeletonLibraryTitle: { flex: 1, height: 20, borderRadius: Spacing.one },
  skeletonBadge: { width: 64, height: 20, borderRadius: Spacing.two },
  skeletonMetadata: { width: '90%', height: 18, borderRadius: Spacing.one },
  skeletonProgressLabel: { width: '55%', height: 16, borderRadius: Spacing.one },
  skeletonPercentage: { width: 28, height: 16, borderRadius: Spacing.one },
  showCard: { flexDirection: 'row', alignItems: 'stretch', gap: Spacing.two, padding: 0, overflow: 'hidden' },
  poster: { width: 76, minHeight: 114 },
  showInfo: { flex: 1, paddingVertical: Spacing.two, paddingRight: Spacing.two, gap: Spacing.one },
  showHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  showTitle: { flex: 1 },
  statusBadge: { borderRadius: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.half, overflow: 'hidden', flexShrink: 0 },
  progress: { marginTop: 'auto', paddingTop: Spacing.two, gap: Spacing.one },
  progressLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  progressLabel: { flex: 1 },
  progressTrack: { height: 4, borderRadius: Spacing.one, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Spacing.one },
});
