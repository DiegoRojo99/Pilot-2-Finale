import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getTopRatedShows } from '@/lib/shows';
import type { TMDBShow } from '@/types/api';
import { ShowCard } from '@/components/show/show-card';

export default function TopRatedAllScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [shows, setShows] = useState<TMDBShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadShows = async () => {
      try {
        setLoading(true);
        const data = await getTopRatedShows();
        setShows(data.results);
      } catch (err) {
        console.error('Failed to load top rated shows:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadShows();
  }, []);

  const handleShowPress = (show: TMDBShow) => {
    router.push({ pathname: '/show/[id]', params: { id: String(show.id) } });
  };

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
          <ThemedText type="subtitle" themeColor="danger">
            Failed to load shows
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
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
          data={shows}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <ShowCard show={item} onShowPress={handleShowPress} />
            </View>
          )}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.flatListContent}
          scrollEnabled={true}
          nestedScrollEnabled={true}
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
  },
  safeArea: {
    flex: 1,
    width: '100%',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
  columnWrapper: {
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  gridItem: {
    flex: 1,
  },
  flatListContent: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
});
