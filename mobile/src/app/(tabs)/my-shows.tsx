import { AuthGate } from '@/components/auth/auth-gate';
import { PlaceholderScreen } from '@/components/placeholder-screen';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getShowEpisodeLogsBatch } from '@/lib/episodes';
import { getMyShows } from '@/lib/shows';
import { UserShowCard } from '@/components/show/user-show-card';
import type { ShowProgress, UserShow } from '@/types/api';

function AuthenticatedMyShows() {
  const theme = useTheme();
  const [shows, setShows] = useState<UserShow[]>([]);
  const [progressByShowId, setProgressByShowId] = useState<Record<number, ShowProgress>>({});
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');


  useEffect(() => {
    let isMounted = true;

    async function fetchShows() {
      try {
        const data = await getMyShows();
        if (!isMounted) return;
        setShows(data);
        setStatus('success');

        const showIds = data.map((show) => show.tmdb_id);
        if (showIds.length === 0) return;

        const logsBatch = await getShowEpisodeLogsBatch(showIds);
        if (!isMounted) return;
        setProgressByShowId(logsBatch.progressByShowId);
      } catch (error) {
        if (!isMounted) return;
        setStatus('error');
        console.error('Failed to load shows:', error);
      }
    }

    void fetchShows();

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === 'loading') {
    return (
      <Card style={styles.centerCard}>
        <ActivityIndicator color={theme.accent} />
        <ThemedText type="small" themeColor="textSecondary">
          Loading your shows...
        </ThemedText>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card>
        <ThemedText type="subtitle">Could not load shows</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Your session may have expired. Try signing out and back in from Profile.
        </ThemedText>
      </Card>
    );
  }

  if (shows.length === 0) {
    return (
      <Card>
        <ThemedText type="subtitle">No shows yet</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Search for a show in Discover and add it to start building your library.
        </ThemedText>
      </Card>
    );
  }

  return (
    <ThemedView style={styles.list}>
      {shows.map((show) => (
        <UserShowCard key={show.id} show={show} progress={progressByShowId[show.tmdb_id]} />
      ))}
    </ThemedView>
  );
}

export default function MyShowsScreen() {

  return (
    <PlaceholderScreen
      eyebrow="Library"
      title="My Shows"
      description="Your saved shows will live here, grouped by watching status so the next episode is easy to find."
      tasks={[]}>
      <AuthGate title="Sign in to view your shows" description="Your watchlist is saved to your account so it can follow you across devices.">
        <AuthenticatedMyShows />
      </AuthGate>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  centerCard: {
    alignItems: 'center',
  },
  list: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
});