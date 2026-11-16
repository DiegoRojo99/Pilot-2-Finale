import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthGate } from '@/components/auth/auth-gate';
import { UserShowCard } from '@/components/show/user-show-card';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getMyShows } from '@/lib/shows';
import { getPosterUrl } from '@/lib/tmdb-images';
import { STATUS_LABELS, type ShowStatus, type UserShow } from '@/types/api';

type Mode = 'up-next' | 'library';
type Filter = ShowStatus | 'all';
const filters: Filter[] = ['watching', 'all', 'want_to_watch', 'watched', 'on_hold', 'dropped'];

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

  return (
    <View style={styles.body}>
      {mode === 'library' && (
        <ScrollView horizontal style={styles.filterScroll} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === item }}
              onPress={() => setFilter(item)}
              style={[styles.filter, { backgroundColor: filter === item ? theme.accent : theme.backgroundElement }]}>
              <ThemedText type="small" style={{ color: filter === item ? theme.accentText : theme.text }}>
                {item === 'all' ? 'All' : STATUS_LABELS[item]}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}>
        {status === 'loading' ? (
          <Card style={styles.center}><ActivityIndicator color={theme.accent} /><ThemedText>Loading your shows...</ThemedText></Card>
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
  const watched = show.watched_episodes_count;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`View ${show.name}`} onPress={() => router.push(`/show/${show.tmdb_id}`)}>
      <Card style={styles.showCard}>
        {poster ? <Image source={{ uri: poster }} style={styles.poster} contentFit="cover" alt={`${show.name} poster`} />
          : <View style={[styles.poster, { backgroundColor: theme.backgroundSelected }]} />}
        <View style={styles.showInfo}>
          <ThemedText type="smallBold">{show.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{STATUS_LABELS[show.status]}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {watched == null ? 'Progress unavailable' : `${watched} ${watched === 1 ? 'episode' : 'episodes'} watched`}
          </ThemedText>
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
  filter: { minHeight: 44, paddingHorizontal: Spacing.three, borderRadius: Spacing.three, justifyContent: 'center' },
  list: { gap: Spacing.two, paddingBottom: Spacing.lg, flexGrow: 1 },
  center: { alignItems: 'center' },
  showCard: { flexDirection: 'row', alignItems: 'center', padding: 0, overflow: 'hidden' },
  poster: { width: 68, height: 100 },
  showInfo: { flex: 1, padding: Spacing.three, gap: Spacing.one },
});
