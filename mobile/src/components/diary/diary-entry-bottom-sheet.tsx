import { Modal, View, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { EpisodeLog } from '@/types/episode';

interface DiaryEntryBottomSheetProps {
  isVisible: boolean;
  entry: EpisodeLog | null;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function DiaryEntryBottomSheet({
  isVisible,
  entry,
  onEdit,
  onDelete,
  onClose,
}: DiaryEntryBottomSheetProps) {
  const theme = useTheme();

  if (!entry) return null;

  const episodeKey = `S${String(entry.season_number).padStart(2, '0')}E${String(entry.episode_number).padStart(2, '0')}`;

  function renderStars(rating: number | null | undefined): string {
    if (!rating || rating <= 0) return '';
    const starsRating = rating / 2;
    const clampedRating = Math.min(Math.max(starsRating, 0), 5);
    const fullStars = Math.floor(clampedRating);
    const hasHalf = clampedRating % 1 >= 0.5;

    let stars = '★'.repeat(fullStars);
    if (hasHalf) stars += '☆';

    const emptyCount = Math.max(0, 5 - Math.ceil(starsRating));
    stars += '☆'.repeat(emptyCount);

    return stars;
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable 
        style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
        onPress={onClose}
      />
      
      <ThemedView 
        type="backgroundElement"
        style={[
          styles.container,
          { 
            backgroundColor: theme.background === '#020617' 
              ? '#0f172a' 
              : '#e2e8f0',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }
        ]}
      >
        {/* Handle bar */}
        <View style={styles.handleBar} />

        {/* Content */}
        <View style={styles.content}>
          {/* Episode Info */}
          <View style={styles.infoSection}>
            <ThemedText 
              type="subtitle" 
              style={[
                styles.showName,
                { color: theme.text }
              ]}
              numberOfLines={2}
            >
              {entry.show_name}
            </ThemedText>

            <View style={styles.episodeRow}>
              <ThemedText 
                type="small" 
                themeColor="textSecondary"
                style={styles.episodeKey}
              >
                {episodeKey}
              </ThemedText>
              <ThemedText 
                type="small" 
                themeColor="textSecondary"
                style={styles.separator}
              >
                ·
              </ThemedText>
              <ThemedText 
                type="small" 
                themeColor="textSecondary"
                numberOfLines={1}
                style={styles.episodeName}
              >
                {entry.episode_name || `Episode ${entry.episode_number}`}
              </ThemedText>
            </View>

            {entry.rating && (
              <ThemedText 
                style={[
                  styles.rating,
                  { color: theme.accent }
                ]}
              >
                {renderStars(entry.rating)} {entry.rating?.toFixed(1)}/10
              </ThemedText>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              onPress={() => {
                onClose();
                onEdit();
              }}
              style={[
                styles.actionButton,
                styles.editButton,
                { 
                  backgroundColor: theme.accent,
                  borderColor: theme.accent,
                }
              ]}
            >
              <ThemedText 
                style={[
                  styles.actionButtonText,
                  { color: theme.accentText, fontWeight: '600' }
                ]}
              >
                Edit entry
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onClose();
                onDelete();
              }}
              style={[
                styles.actionButton,
                styles.deleteButton,
              ]}
            >
              <ThemedText 
                style={[
                  styles.actionButtonText,
                  { color: '#fb7185' }
                ]}
              >
                Delete entry
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Spacing.xl,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.4)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  infoSection: {
    gap: Spacing.sm,
  },
  showName: {
    fontSize: 18,
    fontWeight: '700',
  },
  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  episodeKey: {
    fontWeight: '600',
    fontSize: 13,
  },
  separator: {
    fontSize: 12,
  },
  episodeName: {
    flex: 1,
    fontWeight: '500',
    fontSize: 13,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  actionsSection: {
    gap: Spacing.md,
  },
  actionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#0284c7',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fb7185',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
