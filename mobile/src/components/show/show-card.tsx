import { Image } from 'expo-image';
import { Pressable, View, StyleSheet } from 'react-native';
import { getPosterUrl, getYear } from '@/lib/tmdb-images';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { TMDBShow } from '@/types/api';
import { Spacing } from '@/constants/theme';

export function ShowCard({ show, onShowPress }: { show: TMDBShow; onShowPress?: (show: TMDBShow) => void }) {
  const posterUrl = getPosterUrl(show.poster_path);

  return (
    <Pressable
      key={show.id}
      accessibilityRole="button"
      onPress={() => onShowPress?.(show)}
      style={({ pressed }) => pressed && styles.pressed}>
      <View style={styles.card}> 
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.poster} contentFit="cover" alt={`${show.name} poster`} />
        ) : (
          <ThemedView type="backgroundSelected" style={styles.posterPlaceholder}>
            <ThemedText type="small" themeColor="textSecondary">
              No poster
            </ThemedText>
          </ThemedView>
        )}

        <ThemedView style={styles.infoPanel}>
          <View>
            <ThemedText type="smallBold" numberOfLines={1}>
              {show.name}
            </ThemedText>
          </View>

          <ThemedText type="small" themeColor="textSecondary">
            {getYear(show.first_air_date)} · {show.vote_average.toFixed(1)}
          </ThemedText>
        </ThemedView>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75,
  },
  card: {
    width: 176,
    padding: Spacing.one,
    borderRadius: Spacing.three,
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
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.half,
  },
});