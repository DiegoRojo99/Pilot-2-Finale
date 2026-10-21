import { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TMDBShow } from '@/types/api';
import { ShowCard } from '@/components/show/show-card';

interface ShowGridPageProps {
  title: string;
  loadFn: (page: number) => Promise<{ results: TMDBShow[]; total_results: number }>;
  errorMessage?: string;
}

export function ShowGridPage({ title, loadFn, errorMessage = 'Failed to load shows' }: ShowGridPageProps) {
  const router = useRouter();
  const theme = useTheme();
  const [shows, setShows] = useState<TMDBShow[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const loadShows = async () => {
      try {
        setLoading(true);
        const data = await loadFn(1);
        setShows(data.results);
        setTotalResults(data.total_results);
        setCurrentPage(1);
      } catch (err) {
        console.error(`Failed to load ${title}:`, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadShows();
  }, [title, loadFn]);

  const handleShowPress = (show: TMDBShow) => {
    router.push({ pathname: '/show/[id]', params: { id: String(show.id) } });
  };

  const handleLoadMore = async () => {
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current || loadingMore) return;
    
    // Check if we already have all results
    if (shows.length >= totalResults) return;
    
    isFetchingRef.current = true;
    setLoadingMore(true);
    
    try {
      const nextPage = currentPage + 1;
      const data = await loadFn(nextPage);
      
      // Filter out duplicate shows (by ID) to avoid duplicate key errors
      const newShows = data.results.filter(
        (newShow) => !shows.some((existingShow) => existingShow.id === newShow.id)
      );
      
      // Only add if there are new shows
      if (newShows.length > 0) {
        setShows((prev) => [...prev, ...newShows]);
        setCurrentPage(nextPage);
      } 
      else {
        // If no new shows, we've reached the end
        setCurrentPage(nextPage);
      }
    } catch (err) {
      console.error(`Failed to load more ${title}:`, err);
    } finally {
      isFetchingRef.current = false;
      setLoadingMore(false);
    }
  };

  const visibleShows = shows;
  const hasMore = shows.length < totalResults;

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.centerContent}>
          <ActivityIndicator color={theme.accent} size="large" />
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.textSecondary} />
          <ThemedText type="subtitle" style={styles.errorTitle}>
            {errorMessage}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.errorText}>
            Check your connection and try again.
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <FlatList
          data={visibleShows}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ShowCard show={item} onShowPress={handleShowPress} />
            </View>
          )}
          keyExtractor={(item) => String(item.id)}
          numColumns={4}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.flatListContent}
          scrollEnabled={true}
          onEndReached={() => {
            if (!hasMore) return;
            if (isFetchingRef.current) return;
            if (loadingMore) return;
            handleLoadMore();
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            <View style={styles.footerContainer}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.resultInfo}>
                Showing {shows.length} of {totalResults} results
              </ThemedText>
              {loadingMore && (
                <ActivityIndicator color={theme.accent} />
              )}
            </View>
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  errorTitle: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  errorText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  columnWrapper: {
    gap: Spacing.sm,
    justifyContent: 'flex-start',
  },
  gridItem: {
    maxWidth: 120,
    marginBottom: Spacing.sm,
  },
  flatListContent: {
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  resultInfo: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  footerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
});
