import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getPosterUrl } from '@/lib/tmdb-images';
import type { ShowProgress, UserShow } from '@/types/api';

type UserShowCardProps = {
  show: UserShow;
  progress?: ShowProgress;
};

function getNextEpisodeSummary(show: UserShow, progress?: ShowProgress) {
  const shouldHideEpisodeInfo = !progress;
  const watchedUniqueCount = progress?.watched_unique_count ?? 0;
  const totalEpisodes = progress?.number_of_episodes ?? show.number_of_episodes;
  const remainingEpisodes = Math.max(totalEpisodes - watchedUniqueCount, 0);
  const nextEpisodeFromProgress = progress?.next_episode ?? null;
  const isCompletedByCount = !!progress && totalEpisodes > 0 && watchedUniqueCount >= totalEpisodes;
  const isCompleted = (show.status === 'watched' || isCompletedByCount) && !nextEpisodeFromProgress;
  const shouldSuggestFirstEpisode =
    !!progress && !nextEpisodeFromProgress && !isCompleted && watchedUniqueCount === 0 && totalEpisodes > 0;
  
  if (!nextEpisodeFromProgress && !!progress && !isCompleted && watchedUniqueCount > 0) {
    console.log(`[UserShowCard] Show "${show.name}" has no next episode but should: watched=${watchedUniqueCount}, total=${totalEpisodes}, status=${show.status}`);
  }
  
  const nextEpisode = nextEpisodeFromProgress ?? (shouldSuggestFirstEpisode
    ? {
        tmdb_episode_id: null,
        season_number: 1,
        episode_number: 1,
        episode_name: null,
        has_reliable_next: false,
      }
    : null);
  const nextEpisodeLabel = nextEpisode
    ? `S${String(nextEpisode.season_number).padStart(2, '0')} E${String(nextEpisode.episode_number).padStart(2, '0')}`
    : null;
  const nextEpisodeName = nextEpisode?.episode_name ?? null;
  const remainingAfterNextEpisode = Math.max(remainingEpisodes - (nextEpisode ? 1 : 0), 0);

  if (shouldHideEpisodeInfo || (!nextEpisode && !isCompleted)) {
    return {
      primary: 'Loading episode...',
      secondary: 'Fetching watch progress',
      extra: null,
      isLoading: true,
    };
  }

  return {
    primary: nextEpisodeLabel ?? 'Completed',
    secondary: nextEpisodeName ?? (isCompleted ? 'All episodes watched' : 'Start watching'),
    extra: nextEpisode ? remainingAfterNextEpisode > 0 ? `+${remainingAfterNextEpisode}` : "Last Episode" : null,
    isLoading: false,
  };
}

export function UserShowCard({ show, progress }: UserShowCardProps) {
  const theme = useTheme();
  const posterUrl = getPosterUrl(show.poster_path);
  const nextEpisodeSummary = getNextEpisodeSummary(show, progress);
  const router = useRouter();
  const goToShow = () => { router.push(`/show/${show.tmdb_id}`); };

  return (
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
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {nextEpisodeSummary.secondary}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </Pressable>
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
});