import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getShowDetails } from '@/lib/shows';
import { getBackdropUrl, getPosterUrl, getYear } from '@/lib/tmdb-images';
import type { TMDBShow } from '@/types/api';

type DetailStatus = 'loading' | 'success' | 'error';

export default function ShowDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [status, setStatus] = useState<DetailStatus>('loading');
  const [show, setShow] = useState<TMDBShow | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const showId = Number(id);

    if (!Number.isFinite(showId)) {
      setStatus('error');
      return;
    }

    let isMounted = true;
    setStatus('loading');

    void getShowDetails(showId)
      .then((showDetails) => {
        if (!isMounted) return;
        setShow(showDetails);
        setStatus('success');
      })
      .catch(() => {
        if (!isMounted) return;
        setShow(null);
        setStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const posterUrl = getPosterUrl(show?.poster_path ?? null);
  const backdropUrl = getBackdropUrl(show?.backdrop_path ?? null);

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}>
      {status === 'success' && show && backdropUrl ? (
        <ThemedView style={styles.backdropFrame}>
          <Image source={{ uri: backdropUrl }} style={styles.backdrop} contentFit="cover" contentPosition="top center" />
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', theme.background]}
            locations={[0, 1]}
            style={styles.backdropFade}
          />
        </ThemedView>
      ) : null}

      <SafeAreaView style={styles.safeArea}>
        {status === 'loading' ? (
          <ThemedView type="backgroundElement" style={[styles.stateCard, { borderColor: theme.border }]}> 
            <ActivityIndicator color={theme.accent} />
            <ThemedText type="small" themeColor="textSecondary">
              Loading show details...
            </ThemedText>
          </ThemedView>
        ) : null}

        {status === 'error' ? (
          <ThemedView type="backgroundElement" style={[styles.stateCard, { borderColor: theme.border }]}> 
            <ThemedText type="subtitle">Show unavailable</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              We could not load this show right now. Check your connection and try again.
            </ThemedText>
          </ThemedView>
        ) : null}

        {status === 'success' && show ? (
          <>
            <ThemedView type="backgroundElement" style={[styles.heroCard, { borderColor: theme.border }]}> 
              {posterUrl ? (
                <Image source={{ uri: posterUrl }} style={styles.poster} contentFit="cover" />
              ) : (
                <ThemedView type="backgroundSelected" style={styles.posterPlaceholder}>
                  <ThemedText type="small" themeColor="textSecondary">
                    No poster
                  </ThemedText>
                </ThemedView>
              )}

              <ThemedView type="backgroundElement" style={styles.heroText}>
                <ThemedText type="title">{show.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {getYear(show.first_air_date)} · {show.vote_average.toFixed(1)} / 10
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {show.number_of_seasons ?? 0} seasons · {show.number_of_episodes ?? 0} episodes
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {show.genres && show.genres.length > 0 ? (
              <ThemedView style={styles.genreRow}>
                {show.genres.slice(0, 4).map((genre) => (
                  <ThemedView key={genre.id} type="backgroundSelected" style={styles.genrePill}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {genre.name}
                    </ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
            ) : null}

            <ThemedView type="backgroundElement" style={[styles.overviewCard, { borderColor: theme.border }]}> 
              <ThemedText type="subtitle">Overview</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.overviewText}>
                {show.overview || 'No overview available yet.'}
              </ThemedText>
            </ThemedView>

            {show.seasons && show.seasons.length > 0 ? (
              <ThemedView type="backgroundElement" style={[styles.seasonsCard, { borderColor: theme.border }]}> 
                <ThemedText type="subtitle">Seasons</ThemedText>
                {show.seasons
                  .filter((season) => season.season_number > 0)
                  .map((season) => (
                    <ThemedView key={season.season_number} type="backgroundElement" style={styles.seasonRow}>
                      <ThemedView type="backgroundSelected" style={styles.seasonNumberBadge}>
                        <ThemedText type="smallBold">S{season.season_number}</ThemedText>
                      </ThemedView>
                      <ThemedView type="backgroundElement" style={styles.seasonText}>
                        <ThemedText type="smallBold" numberOfLines={1}>
                          {season.name}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {season.episode_count} episode{season.episode_count === 1 ? '' : 's'}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                  ))}
              </ThemedView>
            ) : null}
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
  backdropFrame: {
    width: '100%',
    aspectRatio: 16 / 13,
    overflow: 'hidden',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  backdropFade: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: 96,
  },
  heroCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Spacing.four,
    borderWidth: 1,
    marginTop: -Spacing.six,
  },
  poster: {
    width: 110,
    height: 165,
    borderRadius: Spacing.two,
  },
  posterPlaceholder: {
    width: 110,
    height: 165,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
  },
  heroText: {
    flex: 1,
    gap: Spacing.two,
    paddingRight: Spacing.two,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  genrePill: {
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
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
  seasonsCard: {
    alignSelf: 'stretch',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 1,
  },
  seasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  seasonNumberBadge: {
    width: 44,
    height: 44,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seasonText: {
    flex: 1,
    gap: Spacing.half,
  },
});