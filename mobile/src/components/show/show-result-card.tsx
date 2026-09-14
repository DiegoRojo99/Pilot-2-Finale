import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getPosterUrl, getYear } from '@/lib/tmdb-images';
import type { TMDBShow } from '@/types/api';

export function ShowResultCard({ show }: { show: TMDBShow }) {
  const theme = useTheme();
  const posterUrl = getPosterUrl(show.poster_path);

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}> 
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
        <ThemedView type="backgroundElement" style={styles.titleStack}>
          <ThemedText type="smallBold" numberOfLines={2}>
            {show.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {getYear(show.first_air_date)} · {show.vote_average.toFixed(1)} / 10
          </ThemedText>
        </ThemedView>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={3}>
          {show.overview || 'No overview available yet.'}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: Spacing.two,
  },
  posterPlaceholder: {
    width: 100,
    height: 150,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
  },
  infoPanel: {
    flex: 1,
    gap: Spacing.two,
    padding: Spacing.three,
    borderTopRightRadius: Spacing.two,
    borderBottomRightRadius: Spacing.two,
  },
  titleStack: {
    gap: Spacing.half,
  },
});