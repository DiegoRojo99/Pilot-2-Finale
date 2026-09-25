import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, TextInput, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getAllEpisodeLogs, updateEpisodeLog, deleteEpisodeLog } from '@/lib/episodes';
import { getSeasonDetails } from '@/lib/shows';
import type { EpisodeLog } from '@/types/episode';
import type { TMDBEpisode } from '@/types/api';
import { Image } from 'expo-image';

export default function DiaryEntryDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [entry, setEntry] = useState<EpisodeLog | null>(null);
  const [episodeDetails, setEpisodeDetails] = useState<TMDBEpisode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [watchedDate, setWatchedDate] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [previousEntry, setPreviousEntry] = useState<EpisodeLog | null>(null);
  const [nextEntry, setNextEntry] = useState<EpisodeLog | null>(null);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        if (!id) return;
        const entryId = parseInt(id, 10);
        const logs = await getAllEpisodeLogs(100);
        const found = logs.find((log) => log.id === entryId);
        if (found) {
          setEntry(found);
          const currentIndex = logs.findIndex((log) => log.id === entryId);
          if (currentIndex > 0) setPreviousEntry(logs[currentIndex - 1]);
          if (currentIndex < logs.length - 1) setNextEntry(logs[currentIndex + 1]);
          setRating(found.rating ?? 0);
          setNotes(found.notes ?? '');
          setWatchedDate(found.watched_at ? found.watched_at.split('T')[0] : new Date().toISOString().split('T')[0]);

          // Fetch episode details
          try {
            const season = await getSeasonDetails(found.tmdb_show_id, found.season_number);
            const episode = season.episodes?.find((ep) => ep.episode_number === found.episode_number);
            if (episode) setEpisodeDetails(episode);
          } 
          catch (err) {
            console.error('Failed to fetch episode details:', err);
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load entry');
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [id]);

  useEffect(() => {
    if (!entry) return;
    const ratingChanged = (entry.rating ?? 0) !== rating;
    const notesChanged = (entry.notes ?? '') !== notes;
    const dateChanged = (entry.watched_at?.split('T')[0] ?? new Date().toISOString().split('T')[0]) !== watchedDate;
    setHasChanges(ratingChanged || notesChanged || dateChanged);
  }, [rating, notes, watchedDate, entry]);

  const handleSave = async () => {
    if (!entry) return;

    if (rating && (rating < 0 || rating > 10 || !Number.isFinite(rating))) {
      Alert.alert('Invalid Rating', 'Rating must be between 0 and 10');
      return;
    }

    setSaving(true);
    try {
      await updateEpisodeLog(entry.id, {
        rating: rating > 0 ? rating : null,
        notes: notes || undefined,
        watched_at: watchedDate ? `${watchedDate}T00:00:00.000Z` : null,
      });
      Alert.alert('Success', 'Entry updated');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!entry) return;

    Alert.alert('Delete Entry', 'Are you sure you want to delete this diary entry?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          setSaving(true);
          try {
            await deleteEpisodeLog(entry.id);
            Alert.alert('Success', 'Entry deleted');
            router.back();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete entry');
          } finally {
            setSaving(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleMenuPress = () => {
    Alert.alert('Options', '', [
      { text: 'Edit entry', onPress: handleSave },
      { text: 'Delete', onPress: handleDelete, style: 'destructive' },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={theme.accent} size="large" />
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText type="subtitle">Entry not found</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const episodeKey = `S${String(entry.season_number).padStart(2, '0')}E${String(entry.episode_number).padStart(2, '0')}`;
  const backdropUrl = episodeDetails?.still_path
    ? `https://image.tmdb.org/t/p/w500${episodeDetails.still_path}`
    : null;

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

  function goToPreviousEntry() {
    if (!previousEntry) return;
    router.push(`/diary/${previousEntry.id}`);
  }

  function goToNextEntry() {
    if (!nextEntry) return;
    router.push(`/diary/${nextEntry.id}`);
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText style={{ fontSize: 20, fontWeight: '600' }}>‹</ThemedText>
          </TouchableOpacity>
          <ThemedText type="subtitle" style={{ fontSize: 16, fontWeight: '600', flex: 1, marginLeft: Spacing.md }}>
            Diary
          </ThemedText>
          <Pressable onPress={handleMenuPress}>
            <ThemedText style={{ fontSize: 18 }}>⋮</ThemedText>
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Backdrop Image */}
          <View style={styles.backdropContainer}>
            {backdropUrl ? (
              <Image
                source={{ uri: backdropUrl }}
                style={styles.backdrop}
              />
            ) : (
              <ThemedView type="backgroundSelected" style={styles.backdrop}>
                <ThemedText themeColor="textSecondary">No image</ThemedText>
              </ThemedView>
            )}
          </View>

          {/* Episode Info */}
          <View style={styles.infoSection}>
            <ThemedText type="subtitle" style={[styles.showName, { color: theme.text }]}>
              {entry.show_name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.episodeKey}>
              {episodeKey} · {entry.episode_name || `Episode ${entry.episode_number}`}
            </ThemedText>

            {/* Rating */}
            <View style={styles.ratingSection}>
              <View style={styles.ratingDisplay}>
                <ThemedText style={[styles.stars, { color: theme.accent }]}>
                  {renderStars(rating)}
                </ThemedText>
                <ThemedText style={[styles.ratingNumber, { color: theme.text }]}>
                  {rating ? rating.toFixed(1) : '0.0'} / 10
                </ThemedText>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={10}
                value={rating}
                onValueChange={setRating}
                step={0.1}
                minimumTrackTintColor={theme.accent}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.accent}
              />
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Watched Date Section */}
          <View style={styles.section}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              WATCHED
            </ThemedText>
            <TextInput
              value={watchedDate}
              onChangeText={setWatchedDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: 'transparent',
                },
              ]}
              editable={!saving}
            />
          </View>

          {/* My Thoughts Section */}
          <View style={styles.section}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              MY THOUGHTS
            </ThemedText>
            <TextInput
              style={[
                styles.notesInput,
                {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: 'transparent',
                },
              ]}
              placeholder="Write your thoughts about this episode..."
              placeholderTextColor={theme.textSecondary}
              multiline
              value={notes}
              onChangeText={setNotes}
              editable={!saving}
            />
          </View>

          {/* Edit Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !hasChanges}
            style={[
              styles.editButton,
              { backgroundColor: theme.accent, opacity: saving ? 0.5 : 1 },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm }}>
              {saving && <ActivityIndicator color={theme.accentText} size="small" />}
              <ThemedText type="small" style={{ color: theme.accentText, fontWeight: '600', fontSize: 14 }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </ThemedText>
            </View>
          </TouchableOpacity>

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[styles.navButton, { borderColor: theme.border }, !previousEntry && { opacity: 0.5 }]}
              disabled={!previousEntry}
              onPress={goToPreviousEntry}
            >
              <ThemedText style={{ color: theme.text, fontWeight: '600' }}>
                ‹ Previous
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navButton, { borderColor: theme.border }, !nextEntry && { opacity: 0.5 }]}
              disabled={!nextEntry}
              onPress={goToNextEntry}
            >
              <ThemedText style={{ color: theme.text, fontWeight: '600' }}>
                Next ›
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  backdropContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  backdrop: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  infoSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  showName: {
    fontSize: 20,
    fontWeight: '700',
  },
  episodeKey: {
    fontSize: 13,
    fontWeight: '500',
  },
  ratingSection: {
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stars: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 4,
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.md,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  input: {
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 0,
    fontSize: 14,
  },
  notesInput: {
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 0,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editButton: {
    marginHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  navButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
