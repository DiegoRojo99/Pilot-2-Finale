import { Image } from 'expo-image';
import { Pressable, View, StyleSheet } from 'react-native';
import { getPosterUrl, getYear } from '@/lib/tmdb-images';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { TMDBShow } from '@/types/api';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';

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
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  card: {
    width: '100%',
    maxWidth: 120,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  poster: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: BorderRadius.lg,
  },
  posterPlaceholder: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  infoPanel: {
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
});