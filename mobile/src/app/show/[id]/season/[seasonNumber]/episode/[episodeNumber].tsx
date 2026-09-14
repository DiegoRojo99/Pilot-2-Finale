import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getSeasonDetails } from '@/lib/shows';
import { formatAirDate, getStillUrl } from '@/lib/tmdb-images';
import type { TMDBEpisode } from '@/types/api';

type EpisodeStatus = 'loading' | 'success' | 'error';

function SkeletonBlock({ style }: { style?: object }) {
  return <ThemedView type="backgroundSelected" style={[styles.skeletonBlock, style]} />;
}

function EpisodeDetailSkeleton() {
  return (
    <>
      <ThemedView type="backgroundElement" style={styles.skeletonStillFrame}>
        <SkeletonBlock style={styles.skeletonStill} />
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.skeletonHeaderCard}>
        <SkeletonBlock style={styles.skeletonMeta} />
        <SkeletonBlock style={styles.skeletonTitle} />
        <SkeletonBlock style={styles.skeletonMetaShort} />
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.skeletonOverviewCard}>
        <SkeletonBlock style={styles.skeletonSectionTitle} />
        <SkeletonBlock style={styles.skeletonLine} />
        <SkeletonBlock style={styles.skeletonLine} />
        <SkeletonBlock style={styles.skeletonLineShort} />
      </ThemedView>
    </>
  );
}

export default function EpisodeDetailScreen() {
  const { id, seasonNumber, episodeNumber } = useLocalSearchParams<{
    id: string;
    seasonNumber: string;
    episodeNumber: string;
  }>();
  const [status, setStatus] = useState<EpisodeStatus>('loading');
  const [episode, setEpisode] = useState<TMDBEpisode | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const showId = Number(id);
    const selectedSeasonNumber = Number(seasonNumber);
    const selectedEpisodeNumber = Number(episodeNumber);

    if (!Number.isFinite(showId) || !Number.isFinite(selectedSeasonNumber) || !Number.isFinite(selectedEpisodeNumber)) {
      setStatus('error');
      return;
    }

    let isMounted = true;
    setStatus('loading');

    void getSeasonDetails(showId, selectedSeasonNumber)
      .then((season) => {
        if (!isMounted) return;
        const foundEpisode = season.episodes?.find((item) => item.episode_number === selectedEpisodeNumber) ?? null;
        setEpisode(foundEpisode);
        setStatus(foundEpisode ? 'success' : 'error');
      })
      .catch(() => {
        if (!isMounted) return;
        setEpisode(null);
        setStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, [episodeNumber, id, seasonNumber]);

  const stillUrl = getStillUrl(episode?.still_path ?? null);

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}>
      {status === 'success' && episode && stillUrl ? (
        <ThemedView style={styles.stillFrame}>
          <Image source={{ uri: stillUrl }} style={styles.still} contentFit="cover" />
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', theme.background]}
            locations={[0, 1]}
            style={styles.stillFade}
          />
        </ThemedView>
      ) : null}

      <SafeAreaView style={styles.safeArea}>
        {status === 'loading' ? <EpisodeDetailSkeleton /> : null}

        {status === 'error' ? (
          <ThemedView type="backgroundElement" style={[styles.stateCard, { borderColor: theme.border }]}> 
            <ThemedText type="subtitle">Episode unavailable</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              We could not load this episode right now. Check your connection and try again.
            </ThemedText>
          </ThemedView>
        ) : null}

        {status === 'success' && episode ? (
          <>
            <ThemedView type="backgroundElement" style={[styles.headerCard, { borderColor: theme.border }]}> 
              <ThemedText type="small" themeColor="textSecondary">
                Season {episode.season_number} · Episode {episode.episode_number}
              </ThemedText>
              <ThemedText type="title">{episode.name || `Episode ${episode.episode_number}`}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatAirDate(episode.air_date)}{episode.runtime ? ` · ${episode.runtime}m` : ''}
              </ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" style={[styles.overviewCard, { borderColor: theme.border }]}> 
              <ThemedText type="subtitle">Overview</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.overviewText}>
                {episode.overview || 'No overview available yet.'}
              </ThemedText>
            </ThemedView>
          </>
        ) : null}
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  stillFrame: {
    width: '100%',
    aspectRatio: 16 / 10,
    overflow: 'hidden',
  },
  still: {
    width: '100%',
    height: '100%',
  },
  stillFade: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: 80,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: 0,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  stateCard: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 1,
  },
  skeletonBlock: {
    opacity: 0.65,
  },
  skeletonStillFrame: {
    alignSelf: 'stretch',
    aspectRatio: 16 / 10,
    marginHorizontal: -Spacing.four,
    overflow: 'hidden',
  },
  skeletonStill: {
    width: '100%',
    height: '100%',
  },
  skeletonHeaderCard: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    marginTop: -Spacing.four,
  },
  skeletonMeta: {
    width: 160,
    height: 16,
    borderRadius: Spacing.two,
  },
  skeletonTitle: {
    width: '88%',
    height: 36,
    borderRadius: Spacing.two,
  },
  skeletonMetaShort: {
    width: 140,
    height: 16,
    borderRadius: Spacing.two,
  },
  skeletonOverviewCard: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  skeletonSectionTitle: {
    width: 120,
    height: 24,
    borderRadius: Spacing.two,
  },
  skeletonLine: {
    width: '100%',
    height: 14,
    borderRadius: Spacing.two,
  },
  skeletonLineShort: {
    width: '64%',
    height: 14,
    borderRadius: Spacing.two,
  },
  headerCard: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 1,
    marginTop: -Spacing.four,
  },
  overviewCard: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 1,
  },
  overviewText: {
    lineHeight: 24,
  },
});