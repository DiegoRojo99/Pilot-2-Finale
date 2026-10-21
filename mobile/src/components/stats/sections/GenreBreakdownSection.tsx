import { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { PieChart } from 'react-native-chart-kit/v2';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getMyShows } from '@/lib/shows';
import { getAllEpisodeLogs } from '@/lib/episodes';

interface GenreBreakdown {
  [key: string]: number;
}

function mockGenreForShow(name: string): string[] {
  // Simple mock based on show name patterns
  const name_lower = name.toLowerCase();
  const genres: string[] = [];

  if (
    name_lower.includes('comedy') ||
    name_lower.includes('funny') ||
    name_lower.includes('laugh')
  )
    genres.push('Comedy');
  if (
    name_lower.includes('drama') ||
    name_lower.includes('serious') ||
    name_lower.includes('crime')
  )
    genres.push('Drama');
  if (
    name_lower.includes('sci-fi') ||
    name_lower.includes('scifi') ||
    name_lower.includes('future')
  )
    genres.push('Sci-Fi');
  if (
    name_lower.includes('fantasy') ||
    name_lower.includes('magic') ||
    name_lower.includes('quest')
  )
    genres.push('Fantasy');
  if (
    name_lower.includes('horror') ||
    name_lower.includes('scary') ||
    name_lower.includes('dark')
  )
    genres.push('Horror');
  if (
    name_lower.includes('thriller') ||
    name_lower.includes('suspense') ||
    name_lower.includes('mystery')
  )
    genres.push('Thriller');
  if (name_lower.includes('romance') || name_lower.includes('love'))
    genres.push('Romance');
  if (name_lower.includes('action') || name_lower.includes('adventure'))
    genres.push('Action');

  return genres.length > 0 ? genres : ['Drama'];
}

const GENRE_COLORS: Record<string, string> = {
  Comedy: '#fbbf24',
  Drama: '#f87171',
  'Sci-Fi': '#60a5fa',
  Fantasy: '#c084fc',
  Horror: '#991b1b',
  Thriller: '#7c3aed',
  Romance: '#ec4899',
  Action: '#ef4444',
  Documentary: '#34d399',
  Animation: '#f59e0b',
};

export function GenreBreakdownSection() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [genreData, setGenreData] = useState<{ name: string; episodes: number; color: string }[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);

      Promise.all([getMyShows(), getAllEpisodeLogs(10000)])
        .then(([shows, logs]) => {
          if (!active) return;

          // Build show ID to genre map
          const showGenreMap = new Map<number, string[]>();
          shows.forEach((show) => {
            showGenreMap.set(show.tmdb_id, mockGenreForShow(show.name));
          });

          // Count episodes per genre
          const genreBreakdown: GenreBreakdown = {};
          logs.forEach((log) => {
            const genres = showGenreMap.get(log.tmdb_show_id) || ['Drama'];
            genres.forEach((genre) => {
              genreBreakdown[genre] = (genreBreakdown[genre] || 0) + 1;
            });
          });

          // Convert to array and sort by episode count
          const data = Object.entries(genreBreakdown)
            .map(([name, episodes]) => ({
              name,
              episodes,
              color: GENRE_COLORS[name] || '#6366f1',
            }))
            .sort((a, b) => b.episodes - a.episodes);

          if (active) {
            setGenreData(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) {
            setGenreData([]);
            setLoading(false);
          }
        });

      return () => {
        active = false;
      };
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.section}>
        <ThemedText type="small" style={styles.sectionTitle}>
          GENRE BREAKDOWN
        </ThemedText>
        <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundElement }]}>
          <ActivityIndicator color={theme.accent} />
        </View>
      </View>
    );
  }

  if (!genreData || genreData.length === 0) {
    return (
      <View style={styles.section}>
        <ThemedText type="small" style={styles.sectionTitle}>
          GENRE BREAKDOWN
        </ThemedText>
        <View style={[styles.emptyContainer, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Log some episodes to see genre breakdown
          </ThemedText>
        </View>
      </View>
    );
  }

  // Format data for v2 PieChart
  const pieData = genreData.map((d) => ({
    name: d.name,
    value: d.episodes,
    color: d.color,
  }));

  return (
    <View style={styles.section}>
      <ThemedText type="small" style={styles.sectionTitle}>
        GENRE BREAKDOWN
      </ThemedText>

      <View style={[styles.chartContainer, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
        <View style={styles.chartWrapper}>
          {/* Chart */}
          <View style={styles.chartArea}>
            <PieChart
              data={pieData}
              valueKey="value"
              labelKey="name"
              width={200}
              height={200}
              legend={false}
              theme={{ background: 'transparent' }}
            />
          </View>

          {/* Legend */}
          <View style={styles.legendColumn}>
            {genreData.map((genre) => (
              <View key={genre.name} style={styles.legendItemCompact}>
                <View style={[styles.legendColorSmall, { backgroundColor: genre.color }]} />
                <ThemedText type="xs" style={styles.legendGenreName} numberOfLines={1}>
                  {genre.name}
                </ThemedText>
                <ThemedText type="xs" themeColor="textSecondary" style={styles.legendCountSmall}>
                  {genre.episodes}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  loadingContainer: {
    height: 220,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 100,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  chartWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  chartArea: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  legendColumn: {
    flex: 1,
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  legendItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendColorSmall: {
    width: 8,
    height: 8,
    borderRadius: 1,
    flexShrink: 0,
  },
  legendGenreName: {
    flex: 1,
    fontSize: 10,
  },
  legendCountSmall: {
    fontSize: 10,
    minWidth: 20,
    textAlign: 'right',
    flexShrink: 0,
  },
});
