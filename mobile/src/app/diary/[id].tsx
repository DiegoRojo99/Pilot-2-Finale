import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [rating, setRating] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [watchedDate, setWatchedDate] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        if (!id) return;
        const entryId = parseInt(id, 10);
        const logs = await getAllEpisodeLogs(100);
        const found = logs.find((log) => log.id === entryId);
        if (found) {
          setEntry(found);
          setRating(found.rating?.toString() ?? '');
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
    const ratingChanged = (entry.rating?.toString() ?? '') !== rating;
    const notesChanged = (entry.notes ?? '') !== notes;
    const dateChanged = (entry.watched_at?.split('T')[0] ?? new Date().toISOString().split('T')[0]) !== watchedDate;
    setHasChanges(ratingChanged || notesChanged || dateChanged);
  }, [rating, notes, watchedDate, entry]);

  const handleSave = async () => {
    if (!entry) return;

    const ratingNum = rating ? Number(rating) : null;
    if (rating && (!ratingNum || ratingNum < 0 || ratingNum > 10 || !Number.isFinite(ratingNum))) {
      Alert.alert('Invalid Rating', 'Rating must be between 0 and 10');
      return;
    }

    setSaving(true);
    try {
      await updateEpisodeLog(entry.id, {
        rating: ratingNum,
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

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', "bottom"]}>
        <ThemedView style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <ThemedText type="title" style={{ fontSize: 20, marginBottom: Spacing.xs }}>
                    {entry.show_name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                    {episodeKey}
                    {entry.episode_name && ` • ${entry.episode_name}`}
                </ThemedText>
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Episode Image */}
                {episodeDetails?.still_path && (
                    <View>
                        <Image
                            source={{ uri: `https://image.tmdb.org/t/p/w500${episodeDetails.still_path}` }}
                            style={{ width: '100%', height: 200, borderRadius: 8 }}
                        /> 
                    </View>
                )}

                {/* Episode Details */}
                {episodeDetails && <EpisodeDetails episode={episodeDetails} />}

                {/* Watched Date */}
                <View style={[styles.section, styles.detailsSubsection]}>
                    <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11, marginBottom: Spacing.xs }}>
                    WATCHED DATE
                    </ThemedText>
                    <TextInput
                        value={watchedDate}
                        onChangeText={setWatchedDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={theme.textSecondary}
                        style={[
                            styles.dateInput,
                            {
                            borderColor: theme.border,
                            color: theme.text,
                            backgroundColor: theme.backgroundElement,
                            },
                        ]}
                        editable={!saving}
                    />
                </View>

                {/* Rating Input */}
                <View style={[styles.section, styles.detailsSubsection]}>
                    <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11, marginBottom: Spacing.xs }}>
                    RATING
                    </ThemedText>
                    <TextInput
                        style={[styles.ratingInput, {
                            borderColor: theme.border,
                            color: theme.text,
                            backgroundColor: theme.backgroundElement,
                        }]}
                        placeholder="Leave empty for no rating"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="decimal-pad"
                        value={rating}
                        onChangeText={setRating}
                        editable={!saving}
                    />
                </View>

                {/* Notes Input */}
                {/* <View style={[styles.section, styles.detailsSubsection]}>
                    <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11, marginBottom: Spacing.xs }}>
                    NOTES
                    </ThemedText>
                    <TextInput
                        style={[styles.notesInput, { borderColor: theme.border, color: theme.text }]}
                        placeholder="Add your thoughts about this episode..."
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        value={notes}
                        onChangeText={setNotes}
                        editable={!saving}
                    />
                </View> */}

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving || !hasChanges}
                        style={[
                            styles.saveButton, 
                            { backgroundColor: theme.accent, opacity: saving || !hasChanges ? 0.5 : 1 },
                        ]}
                    >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm }}>
                        {saving && <ActivityIndicator color={theme.accentText} size="small" />}
                        <ThemedText type="small" style={{ color: theme.accentText, fontWeight: '600', fontSize: 13 }}>
                        {saving ? 'Saving...' : 'Save Changes'}
                        </ThemedText>
                    </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleDelete} disabled={saving} style={[styles.deleteButton, { opacity: saving ? 0.5 : 1 }]}>
                    <ThemedText type="small" style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>
                        Delete Entry
                    </ThemedText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ThemedView>
    </SafeAreaView>
  );
}

function EpisodeDetails({ episode }: { episode: TMDBEpisode }) {
    const theme = useTheme();
    return (
      <View style={styles.detailsSection}>
          {episode.overview && (
          <>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11, marginBottom: Spacing.xs }}>
              EPISODE SUMMARY
              </ThemedText>
              <ThemedText type="small" style={{ fontSize: 13, lineHeight: 18, color: theme.text, marginBottom: Spacing.md }}>
              {episode.overview}
              </ThemedText>
          </>
          )}
          <View style={{ flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' }}>
          {episode.air_date && (
              <View>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 10 }}>
                  AIR DATE
              </ThemedText>
              <ThemedText type="small" style={{ fontSize: 12, marginTop: Spacing.xs }}>
                  {new Date(episode.air_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </ThemedText>
              </View>
          )}
          {episode.runtime && (
              <View>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 10 }}>
                  RUNTIME
              </ThemedText>
              <ThemedText type="small" style={{ fontSize: 12, marginTop: Spacing.xs }}>
                  {episode.runtime}m
              </ThemedText>
              </View>
          )}
          {episode.vote_average > 0 && (
              <View>
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 10 }}>
                  RATING
              </ThemedText>
              <ThemedText type="small" style={{ fontSize: 12, marginTop: Spacing.xs }}>
                  ★ {(episode.vote_average / 2).toFixed(1)}
              </ThemedText>
              </View>
          )}
          </View>
      </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.md,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  saveButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#EF4444',
  },
  detailsSection: {
    padding: Spacing.md,
  },
  detailsSubsection: {
    paddingHorizontal: Spacing.md,
  },
  ratingInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionButtonsContainer: {
    flexDirection: 'column',
    gap: Spacing.sm,
    margin: Spacing.md,
  },
});
