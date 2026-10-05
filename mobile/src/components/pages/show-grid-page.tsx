import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, BorderRadius, Shadows, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TMDBShow } from '@/types/api';
import { ShowCard } from '@/components/show/show-card';

interface ShowGridPageProps {
  title: string;
  loadFn: () => Promise<{ results: TMDBShow[]; total_results: number }>;
  errorMessage?: string;
}

export function ShowGridPage({ title, loadFn, errorMessage = 'Failed to load shows' }: ShowGridPageProps) {
  const router = useRouter();
  const theme = useTheme();
  const [shows, setShows] = useState<TMDBShow[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [displayedCount, setDisplayedCount] = useState(20);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadShows = async () => {
      try {
        setLoading(true);
        const data = await loadFn();
        setShows(data.results);
        setTotalResults(data.total_results);
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

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayedCount((prev) => Math.min(prev + 20, shows.length));
      setLoadingMore(false);
    }, 300);
  };

  const visibleShows = shows.slice(0, displayedCount);
  const hasMore = displayedCount < shows.length;

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
          ListFooterComponent={
            <View style={styles.footerContainer}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.resultInfo}>
                Showing {displayedCount} of {totalResults} results
              </ThemedText>
              {hasMore && (
                <Pressable
                  onPress={handleLoadMore}
                  style={[styles.loadMoreButton, { backgroundColor: theme.accent }]}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator color={theme.accentText} />
                  ) : (
                    <>
                      <Ionicons name="add-circle-outline" size={20} color={theme.accentText} />
                      <ThemedText
                        type="default"
                        style={{ color: theme.accentText, fontWeight: '600' }}
                      >
                        Load More
                      </ThemedText>
                    </>
                  )}
                </Pressable>
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
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  gridItem: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  flatListContent: {
    paddingHorizontal: Spacing.sm,
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
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minHeight: 44,
  },
});
