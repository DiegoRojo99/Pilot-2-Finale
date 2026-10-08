 
import { useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { RatingSlider } from '@/components/ui/rating-slider';
 

type LogEpisodeModalProps = {
  isOpen: boolean;
  episodeLabel: string;
  showName?: string;
  episodeName?: string;
  isPending: boolean;
  defaultWatchedAt?: string | null;
  defaultRating?: number | null;
  onSubmit: (payload: { watchedAt: string | null; rating: number | null }) => void;
  onCancel: () => void;
};

export function LogEpisodeModal({
  isOpen,
  episodeLabel,
  showName,
  episodeName,
  isPending,
  defaultWatchedAt,
  defaultRating = 0,
  onSubmit,
  onCancel,
}: LogEpisodeModalProps) {
  const theme = useTheme();
  
  // Compute defaults
  const defaultWatchedDate = defaultWatchedAt 
    ? defaultWatchedAt.slice(0, 10) 
    : new Date().toISOString().split('T')[0];
  
  const [watchedDate, setWatchedDate] = useState(defaultWatchedDate);
  const [rating, setRating] = useState(defaultRating ?? 0);

  // Reset state when modal opens with fresh defaults
   
  useEffect(() => {
    if (!isOpen) return;
    setWatchedDate(defaultWatchedDate);
    setRating(defaultRating ?? 0);
  }, [isOpen]);

  const handleCancelMemo = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleSubmitMemo = useCallback(() => {
    const watchedAtValue = watchedDate 
      ? new Date(`${watchedDate}T12:00:00Z`).toISOString() 
      : null;

    onSubmit({
      watchedAt: watchedAtValue,
      rating: rating > 0 ? rating : null,
    });
  }, [rating, watchedDate, onSubmit]);

  // Reset state when modal closes (after save completes)
  useEffect(() => {
    if (!isOpen) {
      setWatchedDate('');
      setRating(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleCancelMemo}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="smallBold">Log Episode Watch</ThemedText>
          <View style={styles.episodeDetails}>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
              {showName ? `${showName} - ${episodeLabel}` : episodeLabel}
            </ThemedText>
            {episodeName && (
              <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
                {episodeName}
              </ThemedText>
            )}
          </View>
          
          <View style={styles.modalInputs}>
            <View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
                WATCHED
              </ThemedText>
              <TextInput
                style={[
                  styles.modalInput,
                  { 
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                    paddingHorizontal: Spacing.two,
                    color: theme.text,
                  }
                ]}
                value={watchedDate}
                onChangeText={setWatchedDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textSecondary}
                editable={!isPending}
              />
            </View>

            <View>
              <RatingSlider
                value={rating}
                onValueChange={setRating}
                label="MY RATING"
                displayValue={`${rating.toFixed(1)} / 10`}
                disabled={isPending}
              />
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
              onPress={handleCancelMemo}
              disabled={isPending}
            >
              <ThemedText type="small">Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.accent }]}
              onPress={handleSubmitMemo}
              disabled={isPending}
            >
              <ThemedText type="small" style={{ color: theme.accentText }}>
                {isPending ? 'Saving...' : 'Save'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodeDetails: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: Spacing.one,
    marginBottom: Spacing.one,
  },
  modalContent: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    padding: Spacing.four,
    width: '85%',
    maxWidth: 320,
  },
  modalInputs: {
    gap: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  modalButton: {
    flex: 1,
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
});
