import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getSeasonDetails } from '@/lib/shows';
import { formatAirDate, getStillUrl } from '@/lib/tmdb-images';
import type { TMDBEpisode, TMDBSeason, TMDBSeasonSummary } from '@/types/api';

type SeasonStatus = 'idle' | 'loading' | 'success' | 'error';

type SeasonSummaryRowProps = {
  season: TMDBSeasonSummary;
  showId: number;
  onEpisodePress?: (episode: TMDBEpisode) => void;
};

function EpisodeSummaryRow({ episode, onPress }: { episode: TMDBEpisode; onPress?: (episode: TMDBEpisode) => void }) {
  const stillUrl = getStillUrl(episode.still_path);

  return (
    <Pressable accessibilityRole="button" onPress={() => onPress?.(episode)} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundSelected" style={styles.episodeRow}>
        {stillUrl ? (
          <Image source={{ uri: stillUrl }} style={styles.episodeStill} contentFit="cover" alt={episode.name} />
        ) : (
          <ThemedView type="backgroundElement" style={styles.episodeStillPlaceholder}>
            <ThemedText type="code" themeColor="textSecondary">
              {String(episode.episode_number).padStart(2, '0')}
            </ThemedText>
          </ThemedView>
        )}

        <ThemedView type="backgroundSelected" style={styles.episodeText}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {episode.episode_number}. {episode.name || `Episode ${episode.episode_number}`}
          </ThemedText>
          <ThemedText type="xxs" themeColor="textSecondary">
            {formatAirDate(episode.air_date)}{episode.runtime ? ` · ${episode.runtime}m` : ''}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

export function SeasonSummaryRow({ season, showId, onEpisodePress }: SeasonSummaryRowProps) {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState<SeasonStatus>('idle');
  const [seasonDetails, setSeasonDetails] = useState<TMDBSeason | null>(null);
  const watchedCount = 0;
  const progressPercent = season.episode_count > 0 ? (watchedCount / season.episode_count) * 100 : 0;

  function toggleSeason() {
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);

    if (!nextExpanded || seasonDetails || status === 'loading') return;

    setStatus('loading');
    void getSeasonDetails(showId, season.season_number)
      .then((data) => {
        setSeasonDetails(data);
        setStatus('success');
      })
      .catch(() => {
        setStatus('error');
      });
  }

  return (
    <ThemedView type="backgroundSelected" style={styles.seasonBlock}>
      <Pressable accessibilityRole="button" onPress={toggleSeason} style={({ pressed }) => pressed && styles.pressed}>
        <ThemedView type="backgroundSelected" style={styles.seasonRow}>
          <ThemedView type="backgroundSelected" style={styles.seasonText}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {season.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {watchedCount}/{season.episode_count} episodes
            </ThemedText>
          </ThemedView>

          <ThemedView type="backgroundSelected" style={styles.seasonActions}>
            <ThemedView style={styles.progressTrack}>
              <ThemedView style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: theme.success }]} />
            </ThemedView>
            <SymbolView
              name={{
                ios: isExpanded ? 'chevron.up' : 'chevron.down',
                android: isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down',
                web: isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down',
              }}
              size={18}
              tintColor={theme.textSecondary}
            />
          </ThemedView>
        </ThemedView>
      </Pressable>

      {isExpanded ? (
        <ThemedView type="backgroundSelected" style={styles.episodeList}>
          {status === 'loading' ? (
            <ThemedView type="backgroundSelected" style={styles.inlineStatus}>
              <ActivityIndicator color={theme.accent} />
              <ThemedText type="small" themeColor="textSecondary">
                Loading episodes...
              </ThemedText>
            </ThemedView>
          ) : null}

          {status === 'error' ? (
            <ThemedText type="small" themeColor="danger">
              Episodes could not be loaded right now.
            </ThemedText>
          ) : null}

          {seasonDetails?.episodes?.map((episode) => (
            <EpisodeSummaryRow key={episode.id} episode={episode} onPress={onEpisodePress} />
          ))}
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  seasonBlock: {
    overflow: 'hidden',
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.75,
  },
  seasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  seasonText: {
    flex: 1,
    gap: Spacing.half,
  },
  seasonActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  progressTrack: {
    width: 64,
    height: 6,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#334155',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  episodeList: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  inlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  episodeStill: {
    width: 72,
    height: 48,
    borderRadius: Spacing.two,
  },
  episodeStillPlaceholder: {
    width: 72,
    height: 48,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeText: {
    flex: 1,
    gap: Spacing.half,
  },
});