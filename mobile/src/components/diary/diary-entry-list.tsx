import { View, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getBackdropUrl } from '@/lib/tmdb-images';
import { deleteEpisodeLog } from '@/lib/episodes';
import { DiaryEntryBottomSheet } from '@/components/diary/diary-entry-bottom-sheet';
import type { EpisodeLog } from '@/types/episode';

interface DiaryEntryListProps {
  entry: EpisodeLog;
  onEntryUpdated?: () => void;
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

export function DiaryEntryList({ entry, onEntryUpdated }: DiaryEntryListProps) {
  const router = useRouter();
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const episodeKey = `S${String(entry.season_number).padStart(2, '0')}E${String(entry.episode_number).padStart(2, '0')}`;
  const still = entry.still_path ? getBackdropUrl(entry.still_path) : null;
  const stars = renderStars(entry.rating);

  const handlePress = () => {
    setShowBottomSheet(true);
  };

  const handleEdit = () => {
    if (!entry.id) return;
    router.push({
      pathname: '/diary/[id]',
      params: { id: entry.id.toString() },
    });
  };

  const handleDelete = () => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this diary entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEpisodeLog(entry.id);
            onEntryUpdated?.();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete entry');
          }
        },
      },
    ]);
  };

  return (
    <>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.touchable}>
        <ThemedView type="backgroundElement" style={styles.card}>
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

      <DiaryEntryBottomSheet
        isVisible={showBottomSheet}
        entry={entry}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onClose={() => setShowBottomSheet(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  touchable: {
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
});
