import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { searchShows } from '@/lib/api';
import type { TMDBShow } from '@/types/api';

type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

function getPosterUrl(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w342${path}` : null;
}

function getYear(firstAirDate: string) {
  return firstAirDate ? firstAirDate.slice(0, 4) : 'Unknown year';
}

function ShowResultCard({ show }: { show: TMDBShow }) {
  const theme = useTheme();
  const posterUrl = getPosterUrl(show.poster_path);

  return (
    <ThemedView type="backgroundElement" style={[styles.resultCard, { borderColor: theme.border }]}> 
      {posterUrl ? (
        <Image source={{ uri: posterUrl }} style={styles.poster} contentFit="cover" />
      ) : (
        <ThemedView type="backgroundSelected" style={styles.posterPlaceholder}>
          <ThemedText type="small" themeColor="textSecondary">
            No poster
          </ThemedText>
        </ThemedView>
      )}

      <ThemedView type="backgroundElement" style={styles.resultContent}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {show.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {getYear(show.first_air_date)} · {show.vote_average.toFixed(1)} / 10
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={3}>
          {show.overview || 'No overview available yet.'}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [searchResults, setSearchResults] = useState<TMDBShow[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const theme = useTheme();

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setSearchStatus('idle');
      setSearchResults([]);
      setResultCount(0);
      return;
    }

    let isMounted = true;
    const timeoutId = setTimeout(() => {
      setSearchStatus('loading');

      void searchShows(trimmedQuery)
        .then((data) => {
          if (!isMounted) return;
          setSearchResults(data.results);
          setResultCount(data.total_results);
          setSearchStatus('success');
        })
        .catch(() => {
          if (!isMounted) return;
          setSearchResults([]);
          setResultCount(0);
          setSearchStatus('error');
        });
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [query]);

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="small" themeColor="textSecondary">
            Pilot 2 Finale
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            Find the next show for your watchlist.
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Search TV series, compare the basics, and start building your tracker.
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={[styles.searchCard, { borderColor: theme.border }]}> 
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search TV shows"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={[styles.searchInput, { color: theme.text, borderColor: theme.border }]}
          />

          {query.trim().length < 2 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Type at least 2 characters to search for a show.
            </ThemedText>
          ) : null}

          {searchStatus === 'loading' ? (
            <ThemedView type="backgroundElement" style={styles.inlineStatus}>
              <ActivityIndicator color={theme.accent} />
              <ThemedText type="small" themeColor="textSecondary">
                Searching...
              </ThemedText>
            </ThemedView>
          ) : null}

          {searchStatus === 'error' ? (
            <ThemedText type="small" themeColor="danger">
              Search is unavailable right now. Check your connection and try again.
            </ThemedText>
          ) : null}

          {searchStatus === 'success' ? (
            <ThemedText type="small" themeColor="textSecondary">
              {resultCount} result{resultCount === 1 ? '' : 's'} found
            </ThemedText>
          ) : null}
        </ThemedView>

        {searchResults.length > 0 ? (
          <ThemedView style={styles.resultsList}>
            {searchResults.slice(0, 12).map((show) => (
              <ShowResultCard key={show.id} show={show} />
            ))}
          </ThemedView>
        ) : null}

        {searchStatus === 'idle' ? (
          <ThemedView type="backgroundElement" style={[styles.emptyCard, { borderColor: theme.border }]}> 
            <ThemedText type="subtitle">Start with a title</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Try searching for a show you are currently watching or one you have been meaning to start.
            </ThemedText>
          </ThemedView>
        ) : null}
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  header: {
    gap: Spacing.two,
  },
  title: {
    maxWidth: 360,
  },
  subtitle: {
    maxWidth: 420,
    lineHeight: 22,
  },
  searchCard: {
    alignSelf: 'stretch',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  inlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  resultsList: {
    alignSelf: 'stretch',
    gap: Spacing.three,
  },
  resultCard: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  poster: {
    width: 76,
    height: 114,
    borderRadius: Spacing.two,
  },
  posterPlaceholder: {
    width: 76,
    height: 114,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
  },
  resultContent: {
    flex: 1,
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  emptyCard: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 1,
  },
});
