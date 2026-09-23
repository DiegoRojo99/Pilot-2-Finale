import { View, TouchableOpacity, StyleSheet, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getBackdropUrl } from '@/lib/tmdb-images';
import type { EpisodeLog } from '@/types/episode';

interface DiaryEntryListProps {
  entry: EpisodeLog;
}

function renderStars(rating: number | null | undefined) {
  if (!rating || rating <= 0) return '';
  const starsRating = rating / 2;

  // Clamp rating to 0-5
  const clampedRating = Math.min(Math.max(starsRating, 0), 5);
  const fullStars = Math.floor(clampedRating);
  const hasHalf = clampedRating % 1 >= 0.5;
  
  let stars = '★'.repeat(fullStars);
  if (hasHalf) stars += '☆';
  
  // Fill remaining with empty stars
  const emptyCount = Math.max(0, 5 - Math.ceil(starsRating));
  stars += '☆'.repeat(emptyCount);
  
  return stars;
}

export function DiaryEntryList({ entry }: DiaryEntryListProps) {
  const router = useRouter();
  const episodeKey = `S${String(entry.season_number).padStart(2, '0')}E${String(entry.episode_number).padStart(2, '0')}`;
  const still = entry.still_path ? getBackdropUrl(entry.still_path) : null;
  const stars = renderStars(entry.rating);

  const handlePress = () => {
    if (!entry.id) return;
    router.push({
      pathname: '/diary/[id]',
      params: { id: entry.id.toString() },
    });
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.touchable}>
      <ThemedView type="backgroundElement" style={styles.card}>
        {/* Menu Button - Top Right */}
        <Pressable style={styles.menuButton}>
          <ThemedText style={styles.menuIcon}>⋮</ThemedText>
        </Pressable>

        <View style={styles.contentRow}>
          {/* Still Image */}
          <View style={styles.stillContainer}>
            {still ? (
              <Image
                source={{ uri: still }}
                style={styles.still}
              />
            ) : (
              <ThemedView type="backgroundSelected" style={styles.still}>
                <ThemedText type="xs" themeColor="textSecondary">No image</ThemedText>
              </ThemedView>
            )}
          </View>

          {/* Main Content */}
          <View style={styles.textContent}>
            {/* Episode Name - Large */}
            <ThemedText type="subtitle" style={styles.showName} numberOfLines={1}>
              {entry.episode_name || 'Episode'}
            </ThemedText>

            {/* Show and Episode Info */}
            <View style={styles.episodeInfo}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.episodeKey}>
                {entry.show_name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.episodeKey}>
                {' · '}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.episodeKey}>
                {episodeKey}
              </ThemedText>
            </View>

            {/* Rating and Duration */}
            <View style={styles.ratingDuration}>
              {stars && (
                <ThemedText style={styles.stars}>
                  {stars} {entry.rating?.toFixed(1)}/10
                </ThemedText>
              )}
            </View>
          </View>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: 12,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  contentRow: {
    flexDirection: 'row',
    gap: 0,
  },
  stillContainer: {
    borderRadius: 0,
    overflow: 'hidden',
  },
  still: {
    width: 104,
    height: 96,
    borderRadius: 0,
  },
  textContent: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingRight: 48,
  },
  showName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  episodeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  episodeKey: {
    fontWeight: '500',
    fontSize: 12,
  },
  ratingDuration: {
    marginBottom: 0,
  },
  stars: {
    fontSize: 13,
    fontWeight: '600',
  },
  menuButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    zIndex: 10,
  },
  menuIcon: {
    fontSize: 20,
    fontWeight: '300',
  },
});
