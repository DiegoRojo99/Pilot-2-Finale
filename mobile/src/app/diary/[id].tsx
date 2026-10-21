import { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, TextInput, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RatingSlider } from '@/components/ui/rating-slider';
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
  const [previousEntry, setPreviousEntry] = useState<EpisodeLog | null>(null);
  const [nextEntry, setNextEntry] = useState<EpisodeLog | null>(null);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        if (!id) return;
        const entryId = parseInt(id, 10);
        // Fetch all historical logs to find the specific entry
        const logs = await getAllEpisodeLogs(10000);
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
          catch {
            // Silent error for missing episode details
          }
        }
      } catch {
        Alert.alert('Error', 'Failed to load entry');
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [id]);

  const hasChanges = useMemo(() => {
    if (!entry) return false;
    const ratingChanged = (entry.rating ?? 0) !== rating;
    const notesChanged = (entry.notes ?? '') !== notes;
    const originalDate = entry.watched_at?.split('T')[0] ?? '';
    const dateChanged = originalDate !== watchedDate;
    return ratingChanged || notesChanged || dateChanged;
  }, [rating, notes, watchedDate, entry]);

  const handleSave = async () => {
    if (!entry) return;

    if (rating && (rating < 0 || rating > 10 || !Number.isFinite(rating))) {
      Alert.alert('Invalid Rating', 'Rating must be between 0 and 10');
      return;
    }

    // Store original values for rollback
    const originalEntry = { ...entry, rating: entry.rating, notes: entry.notes, watched_at: entry.watched_at };
    
    // Optimistic update: update UI immediately
    const updatedEntry: EpisodeLog = {
      ...entry,
      rating: rating > 0 ? rating : null,
      notes: notes || null,
      watched_at: watchedDate ? `${watchedDate}T00:00:00.000Z` : null,
      updated_at: new Date().toISOString(),
    };
    setEntry(updatedEntry);
    setSaving(true);

    try {
      // Make API call (set will resolve optimistically)
      await updateEpisodeLog(entry.id, {
        rating: rating > 0 ? rating : null,
        notes: notes || undefined,
        watched_at: watchedDate ? `${watchedDate}T00:00:00.000Z` : null,
      });
      
      // Success - go back immediately (no alert needed for success)
      router.back();
    } catch {
      // Rollback on failure
      setEntry(originalEntry);
      setRating(originalEntry.rating ?? 0);
      setNotes(originalEntry.notes ?? '');
      setWatchedDate(originalEntry.watched_at?.split('T')[0] ?? '');
      
      Alert.alert('Error', 'Failed to save changes. Please try again.');
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
            router.back();
          } catch (error) {
            setSaving(false);
            Alert.alert('Error', 'Failed to delete entry. Please try again.');
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
          <TouchableOpacity onPress={() => router.push('/diary')} style={styles.backButton}>
            <ThemedText style={{ fontSize: 20, fontWeight: '600' }}>‹</ThemedText>
            <ThemedText type="subtitle" style={styles.backText}>
              Diary
            </ThemedText>
          </TouchableOpacity>
          <View style={{ flex: 1 }}></View>
          <Pressable onPress={handleMenuPress} style={styles.menuButton}>
            <ThemedText style={styles.menuButtonText}>⋮</ThemedText>
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
                alt="Backdrop image"
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
              <RatingSlider
                value={rating}
                onValueChange={setRating}
                min={0}
                max={10}
                step={0.1}
                label="EPISODE RATING"
                displayValue={`${rating ? rating.toFixed(1) : '0.0'} / 10`}
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
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: Spacing.md,
  },
  menuButton: {
    padding: Spacing.sm,
    alignItems: 'flex-end',
  },
  menuButtonText: {
    fontSize: 18,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  backdropContainer: {
    marginBottom: Spacing.md,
  },
  backdrop: {
    width: '100%',
    height: 204,
  },
  infoSection: {
    paddingHorizontal: Spacing.md,
    marginVertical: Spacing.md,
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
