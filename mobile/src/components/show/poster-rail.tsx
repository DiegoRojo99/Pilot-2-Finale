import { Image } from 'expo-image';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getPosterUrl, getYear } from '@/lib/tmdb-images';
import type { TMDBShow } from '@/types/api';

type PosterRailProps = {
  title: string;
  shows: TMDBShow[];
};

export function PosterRail({ title, shows }: PosterRailProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle">{title}</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
        {shows.slice(0, 15).map((show) => {
          const posterUrl = getPosterUrl(show.poster_path);

          return (
            <ThemedView key={show.id} type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}> 
              {posterUrl ? (
                <Image source={{ uri: posterUrl }} style={styles.poster} contentFit="cover" />
              ) : (
                <ThemedView type="backgroundSelected" style={styles.posterPlaceholder}>
                  <ThemedText type="small" themeColor="textSecondary">
                    No poster
                  </ThemedText>
                </ThemedView>
              )}
              <ThemedView type="backgroundElement" style={styles.infoPanel}>
                <ThemedText type="smallBold" numberOfLines={2}>
                  {show.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {getYear(show.first_air_date)} · {show.vote_average.toFixed(1)}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
  },
  content: {
    gap: Spacing.three,
    paddingRight: Spacing.four,
  },
  card: {
    width: 132,
    padding: Spacing.one,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  poster: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: Spacing.two,
  },
  posterPlaceholder: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
  },
  infoPanel: {
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomLeftRadius: Spacing.two,
    borderBottomRightRadius: Spacing.two,
  },
});