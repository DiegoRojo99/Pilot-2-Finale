import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getPosterUrl } from '@/lib/tmdb-images';
import type { UserShow } from '@/types/api';

type UserShowCardProps = {
  show: UserShow;
};

function getNextEpisodeSummary(show: UserShow) {
  const nextEpisode = show.next_episode;
  const isCompleted = show.status === 'watched' && !nextEpisode;
  
  const nextEpisodeLabel = nextEpisode
    ? `S${String(nextEpisode.season_number).padStart(2, '0')} E${String(nextEpisode.episode_number).padStart(2, '0')}`
    : null;
  const nextEpisodeName = nextEpisode?.episode_name ?? null;
  const remainingAfterNext = Math.max((show.remaining_episodes_count ?? 0) - 1, 0);

  if (!nextEpisode && !isCompleted) {
    // Show is in progress but we don't have next episode data yet
    return {
      primary: 'Start watching',
      secondary: 'S01 E01',
      extra: null,
      isLoading: true,
    };
  }

  return {
    primary: nextEpisodeLabel ?? 'Completed',
    secondary: nextEpisodeName ?? (isCompleted ? 'All episodes watched' : 'Start watching'),
    extra: nextEpisode && remainingAfterNext > 0 ? `+${remainingAfterNext}` : null,
    isLoading: false,
  };
}

export function UserShowCard({ show }: UserShowCardProps) {
  const theme = useTheme();
  const posterUrl = getPosterUrl(show.poster_path);
  const nextEpisodeSummary = getNextEpisodeSummary(show);
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