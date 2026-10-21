import { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { PieChart } from 'react-native-chart-kit/v2';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getGenreBreakdown } from '@/lib/episodes';

interface GenreData {
  name: string;
  shows: number;
  color: string;
}

export function GenreBreakdownSection() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [genreData, setGenreData] = useState<GenreData[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);

      getGenreBreakdown()
        .then((data) => {
          if (!active) return;

          // Map API response to component format
          const formattedData = data.map((item) => ({
            name: item.genre,
            shows: item.shows,
            color: item.color,
          }));

          setGenreData(formattedData);
          setLoading(false);
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
    value: d.shows,
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
              selectedIndex={selectedIndex}
              interaction={{
                mode: 'tap',
                onSelect: (event) => setSelectedIndex(event.index),
              }}
            />
          </View>

          {/* Legend */}
          <View style={styles.legendColumn}>
            {genreData.map((genre) => (
              <GenreLegendItem
                key={genre.name}
                genre={genre}
                isSelected={selectedIndex === genreData.indexOf(genre)}
                selectGenre={() => setSelectedIndex(genreData.indexOf(genre))}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function GenreLegendItem({ genre, isSelected, selectGenre }: { genre: GenreData, isSelected: boolean, selectGenre: () => void }) {
  return (
    <TouchableOpacity onPress={selectGenre} key={genre.name} style={[styles.legendItemCompact, isSelected && styles.legendItemSelected]}>
      <View style={[styles.legendColorSmall, { backgroundColor: genre.color }]} />
      <ThemedText type="xs" style={styles.legendGenreName} numberOfLines={1}>
        {genre.name}
      </ThemedText>
      <ThemedText type="xs" themeColor="textSecondary" style={[styles.legendCountSmall, isSelected && { fontWeight: '600' }]}>
        {genre.shows}
      </ThemedText>
    </TouchableOpacity>
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
    paddingHorizontal: Spacing.xs,
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
  legendItemSelected: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});
