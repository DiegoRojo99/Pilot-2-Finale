import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { RatingInput, NotesInput } from '@/components/diary';
import { getAllEpisodeLogs, updateEpisodeLog, deleteEpisodeLog } from '@/lib/episodes';
import type { EpisodeLog } from '@/types/api';

export default function DiaryEntryDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [entry, setEntry] = useState<EpisodeLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
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
    setHasChanges(ratingChanged || notesChanged);
  }, [rating, notes, entry]);

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
  const watchedDate = entry.watched_at
    ? new Date(entry.watched_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Not dated';

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: Spacing.md }}>
            <ThemedText type="subtitle" style={{ color: theme.accent }}>
              ← Back
            </ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={{ fontSize: 24, marginBottom: Spacing.sm }}>
            {entry.show_name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {episodeKey}
            {entry.episode_name && ` • ${entry.episode_name}`}
          </ThemedText>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Watched Date Info */}
          <View style={[styles.section, { backgroundColor: theme.surfaceBackground }]}>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.sm }}>
              WATCHED
            </ThemedText>
            <ThemedText type="subtitle">{watchedDate}</ThemedText>
          </View>

          {/* Rating Input */}
          <View style={styles.section}>
            <RatingInput value={rating} onChangeText={setRating} disabled={saving} />
          </View>

          {/* Notes Input */}
          <View style={styles.section}>
            <NotesInput value={notes} onChangeText={setNotes} disabled={saving} />
          </View>

          {/* Action Buttons */}
          <View style={{ gap: Spacing.md, marginTop: Spacing.lg }}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || !hasChanges}
              style={[
                styles.button,
                {
                  backgroundColor: theme.accent,
                  opacity: saving || !hasChanges ? 0.5 : 1,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm }}>
                {saving && <ActivityIndicator color={theme.accentText} size="small" />}
                <ThemedText type="subtitle" style={{ color: theme.accentText, fontWeight: '600' }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDelete} disabled={saving} style={[styles.button, { backgroundColor: '#EF4444', opacity: saving ? 0.5 : 1 }]}>
              <ThemedText type="subtitle" style={{ color: '#fff', fontWeight: '600' }}>
                Delete Entry
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
});
