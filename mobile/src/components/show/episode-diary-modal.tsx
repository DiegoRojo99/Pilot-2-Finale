import { useState, useEffect, useCallback } from 'react';
import { Modal, View, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EpisodeDiaryModalProps = {
  isOpen: boolean;
  episodeLabel: string;
  showName?: string;
  episodeName?: string;
  isPending: boolean;
  title?: string;
  submitLabel?: string;
  defaultWatchedAt?: string | null;
  defaultRating?: number | null;
  onSubmit: (payload: { watchedAt: string | null; rating: number | null }) => void;
  onCancel: () => void;
};

export function EpisodeDiaryModal({
  isOpen,
  episodeLabel,
  showName,
  episodeName,
  isPending,
  title = 'Log Episode Watch',
  submitLabel = 'Save',
  defaultWatchedAt = null,
  defaultRating = null,
  onSubmit,
  onCancel,
}: EpisodeDiaryModalProps) {
  const theme = useTheme();
  const [watchedDate, setWatchedDate] = useState('');
  const [ratingInput, setRatingInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setWatchedDate(defaultWatchedAt ? defaultWatchedAt.slice(0, 10) : '');
    setRatingInput(defaultRating === null || defaultRating === undefined ? '' : String(defaultRating));
    setError(null);
  }, [defaultRating, defaultWatchedAt, isOpen]);
  
  // Memoize cancel handler to prevent re-renders
  const handleCancelMemo = useCallback(() => {
    setError(null);
    setWatchedDate('');
    setRatingInput('');
    onCancel();
  }, [onCancel]);

  // Memoize submit handler
  const handleSubmitMemo = useCallback(() => {
    const parsedRating = ratingInput.trim() === '' ? null : Number(ratingInput);
    const isValidNumber = parsedRating === null || (Number.isFinite(parsedRating) && parsedRating >= 0 && parsedRating <= 10);

    if (!isValidNumber) {
      setError('Rating must be between 0 and 10.');
      return;
    }

    setError(null);

    const wasWatchedToday = watchedDate && new Date(watchedDate).toDateString() === new Date().toDateString();
    const watchedAtValue = wasWatchedToday ? new Date().toISOString() : watchedDate ? new Date(`${watchedDate}T12:00:00Z`).toISOString() : null;

    onSubmit({
      watchedAt: watchedAtValue,
      rating: parsedRating,
    });

    setWatchedDate('');
    setRatingInput('');
  }, [ratingInput, watchedDate, onSubmit]);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleCancelMemo}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.backgroundElement }]}>
          <ScrollView>
            <ThemedText type="subtitle">{title}</ThemedText>
            {episodeName && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.episodeName}>
                {episodeName}
              </ThemedText>
            )}
            <ThemedText type="small" themeColor="textSecondary" style={styles.episodeLabel}>
              {showName ? `${showName} • ${episodeLabel}` : episodeLabel}
            </ThemedText>

            <View style={styles.inputContainer}>
              <ThemedText type="small" style={styles.label}>
                Watched date (optional)
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSelected,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textSecondary}
                value={watchedDate}
                onChangeText={setWatchedDate}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText type="small" style={styles.label}>
                Rating (optional)
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSelected,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="e.g. 8"
                placeholderTextColor={theme.textSecondary}
                value={ratingInput}
                onChangeText={setRatingInput}
                keyboardType="decimal-pad"
              />
            </View>

            {error && (
              <ThemedText type="small" style={[styles.error, { color: theme.danger }]}>
                {error}
              </ThemedText>
            )}
          </ScrollView>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={handleCancelMemo}
              disabled={isPending}
              style={[
                styles.button,
                styles.cancelButton,
                {
                  backgroundColor: theme.backgroundSelected,
                  opacity: isPending ? 0.6 : 1,
                },
              ]}
            >
              <ThemedText type="small" style={styles.buttonText}>
                Cancel
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleSubmitMemo}
              disabled={isPending}
              style={[
                styles.button,
                styles.submitButton,
                {
                  backgroundColor: theme.accent,
                  opacity: isPending ? 0.6 : 1,
                },
              ]}
            >
              <ThemedText type="small" style={[styles.buttonText, { color: theme.accentText ?? 'white' }]}>
                {isPending ? 'Saving...' : submitLabel}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    width: '85%',
    maxHeight: '80%',
  },
  episodeName: {
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  episodeLabel: {
    marginBottom: Spacing.three,
  },
  inputContainer: {
    marginBottom: Spacing.three,
  },
  label: {
    marginBottom: Spacing.one,
    fontWeight: '600',
  },
  input: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  error: {
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  cancelButton: {},
  submitButton: {},
  buttonText: {
    fontWeight: '600',
  },
});
