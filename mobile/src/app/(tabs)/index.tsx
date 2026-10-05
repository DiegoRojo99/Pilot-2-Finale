import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PosterRail } from '@/components/show/poster-rail';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing, BorderRadius, TouchTarget, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getTopRatedShows, getTrendingShows, searchShows } from '@/lib/shows';
import type { TMDBShow } from '@/types/api';
import { ShowCard } from '@/components/show/show-card';

type SearchStatus = 'idle' | 'loading' | 'success' | 'error';
type SuggestionsStatus = 'loading' | 'success' | 'error';
type FilterType = 'all' | 'trending' | 'toprated';

const FILTERS = [
  { id: 'all', label: 'All', icon: 'apps-outline' as const },
  { id: 'trending', label: 'Trending', icon: 'trending-up' as const },
  { id: 'toprated', label: 'Top Rated', icon: 'star' as const },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [searchResults, setSearchResults] = useState<TMDBShow[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [suggestionsStatus, setSuggestionsStatus] = useState<SuggestionsStatus>('loading');
  const [trendingShows, setTrendingShows] = useState<TMDBShow[]>([]);
  const [topRatedShows, setTopRatedShows] = useState<TMDBShow[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const theme = useTheme();

  function handleQueryChange(value: string) {
    setQuery(value);

    if (value.trim().length < 2) {
      setSearchStatus('idle');
      setSearchResults([]);
      setResultCount(0);
    }
  }

  function handleClearSearch() {
    setQuery('');
    setSearchStatus('idle');
    setSearchResults([]);
    setResultCount(0);
  }

  function openShow(show: TMDBShow) {
    router.push({ pathname: '/show/[id]', params: { id: String(show.id) } });
  }

  useEffect(() => {
    let isMounted = true;

    void Promise.all([getTrendingShows(), getTopRatedShows()])
      .then(([trendingData, topRatedData]) => {
        if (!isMounted) return;
        setTrendingShows(trendingData.results);
        setTopRatedShows(topRatedData.results);
        setSuggestionsStatus('success');
      })
      .catch(() => {
        if (!isMounted) return;
        setSuggestionsStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) return;

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
    <SafeAreaView edges={['top']} style={styles.safeAreaWrapper}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.safeArea}>
        <ThemedText type="title">
          Discover
        </ThemedText>

        <ThemedView style={[styles.searchPill, { backgroundColor: theme.surfaceBackground }]}> 
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Search shows"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={[styles.searchInput, { color: theme.text }]}
            />
            {query.length > 0 && (
              <Pressable onPress={handleClearSearch} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>

          {searchStatus === 'loading' ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={theme.accent} />
              <ThemedText type="small" themeColor="textSecondary">
                Searching...
              </ThemedText>
            </View>
          ) : null}

          {searchStatus === 'error' ? (
            <ThemedText type="small" themeColor="danger">
              Search is unavailable right now. Check your connection and try again.
            </ThemedText>
          ) : null}

          {searchStatus === 'success' && query.trim().length >= 2 ? (
            <ThemedText type="small" themeColor="textSecondary">
              {resultCount} result{resultCount === 1 ? '' : 's'} found
            </ThemedText>
          ) : null}
        </ThemedView>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
        >
          {FILTERS.map((filter) => (
            <Pressable
              key={filter.id}
              onPress={() => setActiveFilter(filter.id as FilterType)}
              style={[
                styles.filterChip,
                activeFilter === filter.id && {
                  backgroundColor: theme.accent,
                },
                activeFilter !== filter.id && {
                  backgroundColor: theme.surfaceBackground,
                  borderWidth: 1,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons 
                name={filter.icon} 
                size={16} 
                color={activeFilter === filter.id ? theme.accentText : theme.text}
              />
              <ThemedText 
                type="small"
                style={{
                  color: activeFilter === filter.id ? theme.accentText : theme.text,
                  fontWeight: activeFilter === filter.id ? '600' : '500',
                }}
              >
                {filter.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {searchResults.length > 0 ? (
          <PosterRail
            title="Search Results"
            icon="magnifyingglass"
            shows={searchResults}
            onShowPress={openShow}
          />
        ) : searchStatus === 'success' && query.trim().length >= 2 ? (
          <ThemedView style={[styles.emptyStateCard, { backgroundColor: theme.surfaceBackground }]}>
            <Ionicons name="search-outline" size={48} color={theme.textSecondary} />
            <View style={styles.emptyStateContent}>
              <ThemedText type="subtitle" style={styles.emptyStateTitle}>No results found</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyStateMessage}>
                Try adjusting your search or browse our suggestions below
              </ThemedText>
            </View>
          </ThemedView>
        ) : null}

        <ThemedView style={styles.suggestions}>
          {suggestionsStatus === 'loading' ? (
            <ThemedView style={[styles.emptyStateCard, { backgroundColor: theme.surfaceBackground }]}> 
              <ActivityIndicator size="large" color={theme.accent} />
              <ThemedText type="small" themeColor="textSecondary">
                Loading suggestions...
              </ThemedText>
            </ThemedView>
          ) : null}

          {suggestionsStatus === 'error' ? (
            <ThemedView style={[styles.emptyStateCard, { backgroundColor: theme.surfaceBackground }]}> 
              <Ionicons name="alert-circle-outline" size={48} color={theme.textSecondary} />
              <View style={styles.emptyStateContent}>
                <ThemedText type="subtitle" style={styles.emptyStateTitle}>Couldn't load suggestions</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyStateMessage}>
                  Check your connection, but search is ready anytime
                </ThemedText>
              </View>
            </ThemedView>
          ) : null}

          {suggestionsStatus === 'success' ? (
            <>
              <View style={styles.railSection}>
                <View style={styles.sectionHeader}>
                  <View>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>Trending Now</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">What's popular this week</ThemedText>
                  </View>
                  <Pressable 
                    hitSlop={8}
                    onPress={() => router.push('/discover/trending-all')}
                    style={({ pressed }) => pressed && styles.seeAllPressed}
                  >
                    <ThemedText type="small" themeColor="accent" style={styles.seeAllText}>See All</ThemedText>
                  </Pressable>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.posterRow}
                >
                  {trendingShows.slice(0, 10).map((show) => (
                    <View key={show.id} style={styles.posterItem}>
                      <ShowCard show={show} onShowPress={openShow} />
                    </View>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.railSection}>
                <View style={styles.sectionHeader}>
                  <View>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>Top Rated</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">Highest rated shows</ThemedText>
                  </View>
                  <Pressable 
                    hitSlop={8}
                    onPress={() => router.push('/discover/top-rated-all')}
                    style={({ pressed }) => pressed && styles.seeAllPressed}
                  >
                    <ThemedText type="small" themeColor="accent" style={styles.seeAllText}>See All</ThemedText>
                  </Pressable>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.posterRow}
                >
                  {topRatedShows.slice(0, 10).map((show) => (
                    <View key={show.id} style={styles.posterItem}>
                      <ShowCard show={show} onShowPress={openShow} />
                    </View>
                  ))}
                </ScrollView>
              </View>
            </>
          ) : null}
        </ThemedView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaWrapper: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  safeArea: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  header: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  title: {
    fontWeight: 'bold',
  },
  searchPill: {
    alignSelf: 'stretch',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    height: TouchTarget.default,
    justifyContent: 'center',
  },
  searchIcon: {
    marginRight: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  suggestions: {
    alignSelf: 'stretch',
    gap: Spacing.xl,
  },
  railSection: {
    gap: Spacing.md,
  },
  emptyStateCard: {
    alignSelf: 'stretch',
    gap: Spacing.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    alignItems: 'center',
  },
  emptyStateContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyStateTitle: {
    textAlign: 'center',
  },
  emptyStateMessage: {
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCard: {
    alignSelf: 'stretch',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  seeAllPressed: {
    opacity: 0.7,
  },
  seeAllText: {
    fontWeight: '600',
  },
  posterRow: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  posterItem: {
    marginRight: Spacing.md,
  },
  filterRow: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    minHeight: TouchTarget.small,
    marginRight: Spacing.md,
  },
});
