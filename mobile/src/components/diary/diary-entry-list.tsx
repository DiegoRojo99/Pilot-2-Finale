import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { EpisodeLog } from '@/types/api';

interface DiaryEntryListProps {
  entry: EpisodeLog;
}

export function DiaryEntryList({ entry }: DiaryEntryListProps) {
  const theme = useTheme();
  const router = useRouter();

  const episodeKey = `S${String(entry.season_number).padStart(2, '0')}E${String(entry.episode_number).padStart(2, '0')}`;
  const ratingDisplay = entry.rating ? `★ ${entry.rating}` : '';

  const handlePress = () => {
    if (!entry.id) return;
    router.push({
      pathname: '/diary/[id]',
      params: {
        id: entry.id.toString(),
      },
    });
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <View style={[styles.container, { borderBottomColor: theme.border }]}>
        <View style={{ flex: 1 }}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.episodeKey}>
            {episodeKey}
          </ThemedText>
          <ThemedText type="subtitle" numberOfLines={1} style={{ marginTop: Spacing.xs }}>
            {entry.show_name}
          </ThemedText>
          {entry.episode_name && (
            <ThemedText type="small" numberOfLines={1} themeColor="textSecondary" style={{ marginTop: Spacing.xs }}>
              {entry.episode_name}
            </ThemedText>
          )}
        </View>

        {/* Rating on the right */}
        {ratingDisplay && (
          <ThemedText style={{ color: theme.accent, fontWeight: 'bold', fontSize: 14, marginLeft: Spacing.md }}>
            {ratingDisplay}
          </ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  episodeKey: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
