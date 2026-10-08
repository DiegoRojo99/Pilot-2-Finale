import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getPosterUrl } from '@/lib/tmdb-images';
import { logEpisode } from '@/lib/episodes';
import { LogEpisodeModal } from '@/components/show/log-episode-modal';
import type { UserShow } from '@/types/api';

type UserShowCardProps = {
  show: UserShow;
  onEpisodeLogged?: () => void;
};

function getNextEpisodeSummary(show: UserShow) {
  const nextEpisode = show.next_episode;
  const isCompleted = show.status === 'watched' && !nextEpisode;
  
  const nextEpisodeLabel = nextEpisode
    ? `S${String(nextEpisode.season_number).padStart(2, '0')} E${String(nextEpisode.episode_number).padStart(2, '0')}`
    : null;
  const nextEpisodeName = nextEpisode?.episode_name ?? null;
  const remainingAfterNext = Math.max((show.remaining_episodes_count ?? 0) - 1, 0);

  if (nextEpisode) {
    return {
      primary: nextEpisodeLabel ?? 'Upcoming',
      secondary: nextEpisodeName ?? 'TBA',
      extra: remainingAfterNext > 0 ? `+${remainingAfterNext}` : null,
      isLoading: false,
    };
  }
  
  // Check if all episodes have been watched
  const allEpisodesWatched = isCompleted || (show.remaining_episodes_count ?? 0) === 0;
  
  // All episodes watched
  if (allEpisodesWatched) {
    return {
      primary: 'Completed',
      secondary: 'All episodes watched',
      extra: null,
      isLoading: false,
    };
  }
  // Show is in progress but we don't have next episode data yet (loading state)
  else {
    return {
      primary: 'Start watching',
      secondary: 'S01 E01',
      extra: null,
      isLoading: true,
    };
  }
}

export function UserShowCard({ show, onEpisodeLogged }: UserShowCardProps) {
  const theme = useTheme();
  const posterUrl = getPosterUrl(show.poster_path);
  const nextEpisodeSummary = getNextEpisodeSummary(show);
  const router = useRouter();
  const [isEpisodeDiaryModalOpen, setIsEpisodeDiaryModalOpen] = useState(false);
  const [isLoggingEpisode, setIsLoggingEpisode] = useState(false);
  const goToShow = () => { router.push(`/show/${show.tmdb_id}`); };

  const nextEpisode = show.next_episode ?? null;
  const nextEpisodeLabel = nextEpisode
    ? `S${String(nextEpisode.season_number).padStart(2, '0')} E${String(nextEpisode.episode_number).padStart(2, '0')}`
    : null;

  const handleLogEpisode = useCallback(async ({
    watchedAt,
    rating,
  }: {
    watchedAt: string | null;
    rating: number | null;
  }) => {
    if (!nextEpisode) return;

    setIsLoggingEpisode(true);
    try {
      await logEpisode({
        tmdb_show_id: show.tmdb_id,
        tmdb_episode_id: nextEpisode.tmdb_episode_id ?? undefined,
        season_number: nextEpisode.season_number,
        episode_number: nextEpisode.episode_number,
        episode_name: nextEpisode.episode_name ?? undefined,
        watched_at: watchedAt,
        rating: rating ?? undefined,
      });
      setIsEpisodeDiaryModalOpen(false);
      onEpisodeLogged?.();
    } catch (error) {
      console.error('Error logging episode:', error);
    } finally {
      setIsLoggingEpisode(false);
    }
  }, [nextEpisode, show.tmdb_id, onEpisodeLogged]);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={goToShow}
        style={({ pressed }) => pressed && styles.pressed}>
        <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}> 
          {posterUrl ? (
            <Image source={{ uri: posterUrl }} style={styles.poster} contentFit="cover" alt={`${show.name} poster`} />
          ) : (
            <ThemedView type="backgroundSelected" style={styles.posterPlaceholder}>
              <ThemedText type="small" themeColor="textSecondary">
                No poster
              </ThemedText>
            </ThemedView>
          )}

          <ThemedView type="backgroundElement" style={styles.infoPanel}>
            <ThemedView type="backgroundElement" style={styles.titleStack}>
              <ThemedText type="smallBold" numberOfLines={2}>
                {show.name}
              </ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.progressBlock}>
              <ThemedView type="backgroundElement" style={styles.progressTitleRow}>
                <ThemedText type="smallBold" themeColor={nextEpisodeSummary.isLoading ? 'textSecondary' : 'accent'} numberOfLines={1}>
                  {nextEpisodeSummary.primary}
                </ThemedText>
                {nextEpisodeSummary.extra ? (
                  <ThemedText type="code" themeColor="textSecondary">
                    {nextEpisodeSummary.extra}
                  </ThemedText>
                ) : null}
              </ThemedView>
              <ThemedView type='backgroundElement' style={styles.secondaryRow}>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
                  {nextEpisodeSummary.secondary}
                </ThemedText>
                {nextEpisode && !nextEpisodeSummary.isLoading && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      setIsEpisodeDiaryModalOpen(true);
                    }}
                    style={[styles.logButton, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}
                  >
                    <SymbolView
                      name={{
                        ios: 'checkmark',
                        android: 'done',
                        web: 'done',
                      }}
                      size={16}
                      tintColor="#60a5fa"
                    />
                  </Pressable>
                )}
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </Pressable>

      <LogEpisodeModal
        isOpen={isEpisodeDiaryModalOpen}
        episodeLabel={nextEpisodeLabel ?? 'Unknown Episode'}
        showName={show.name}
        episodeName={nextEpisode?.episode_name ?? undefined}
        isPending={isLoggingEpisode}
        defaultWatchedAt={new Date().toISOString().split('T')[0]}
        defaultRating={0}
        onSubmit={handleLogEpisode}
        onCancel={() => setIsEpisodeDiaryModalOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  poster: {
    width: 68,
    height: 104,
    borderTopLeftRadius: Spacing.two,
    borderBottomLeftRadius: Spacing.two,
  },
  posterPlaceholder: {
    width: 68,
    height: 104,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
  },
  infoPanel: {
    flex: 1,
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderTopRightRadius: Spacing.two,
    borderBottomRightRadius: Spacing.two,
  },
  titleStack: {
    gap: Spacing.half,
  },
  progressBlock: {
    gap: Spacing.half,
  },
  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.one,
  },
  logButton: {
    width: 32,
    height: 32,
    borderRadius: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
  },
});