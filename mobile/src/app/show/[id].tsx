import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { SeasonSummaryRow } from '@/components/show/season-summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Skeleton } from '@/components/ui/skeleton';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getShowDetails, getUserShowDetails } from '@/lib/shows';
import { getBackdropUrl, getPosterUrl, getYear } from '@/lib/tmdb-images';
import { STATUS_LABELS, type ShowStatus, type TMDBEpisode, type TMDBShow, type UserShow } from '@/types/api';

type DetailStatus = 'loading' | 'success' | 'error';

function ShowDetailSkeleton() {
  return (
    <>
      <ThemedView type="backgroundElement" style={styles.skeletonBackdrop}>
        <Skeleton style={styles.skeletonBackdropFill} />
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.skeletonHeroCard}>
        <Skeleton style={styles.skeletonPoster} />
        <ThemedView type="backgroundElement" style={styles.skeletonHeroText}>
          <Skeleton style={styles.skeletonTitle} />
          <Skeleton style={styles.skeletonMeta} />
          <Skeleton style={styles.skeletonMetaShort} />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.skeletonGenreRow}>
        <Skeleton style={styles.skeletonGenrePill} />
        <Skeleton style={styles.skeletonGenrePill} />
        <Skeleton style={styles.skeletonGenrePillShort} />
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.skeletonContentCard}>
        <Skeleton style={styles.skeletonSectionTitle} />
        <Skeleton style={styles.skeletonLine} />
        <Skeleton style={styles.skeletonLine} />
        <Skeleton style={styles.skeletonLineShort} />
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.skeletonContentCard}>
        <Skeleton style={styles.skeletonSectionTitle} />
        <Skeleton style={styles.skeletonSeasonRow} />
        <Skeleton style={styles.skeletonSeasonRow} />
        <Skeleton style={styles.skeletonSeasonRow} />
      </ThemedView>
    </>
  );
}

export default function ShowDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [status, setStatus] = useState<DetailStatus>('loading');
  const [show, setShow] = useState<TMDBShow | null>(null);
  const [userShow, setUserShow] = useState<UserShow | null>(null);
  const [loadedShowId, setLoadedShowId] = useState<number | null>(null);
  const theme = useTheme();
  const showId = Number(id);
  const hasValidShowId = Number.isFinite(showId);
  const isCurrentShowLoaded = loadedShowId === showId;

  useEffect(() => {
    if (!hasValidShowId) return;
    let isMounted = true;

    void getShowDetails(showId)
      .then((showDetails) => {
        if (!isMounted) return;
        setShow(showDetails);
        setLoadedShowId(showId);
        setStatus('success');
      })
      .catch(() => {
        if (!isMounted) return;
        setShow(null);
        setUserShow(null);
        setLoadedShowId(null);
        setStatus('error');
      });

    void getUserShowDetails(showId)
      .then((userShowDetails) => {
        if (!isMounted) return;
        setUserShow(userShowDetails);
        setLoadedShowId(showId);
        setStatus('success');
      })
      .catch(() => {
        if (!isMounted) return;
        setUserShow(null);
        setLoadedShowId(null);
        setStatus('error');
      });

    return () => { isMounted = false; };
  }, [hasValidShowId, showId]);

  const posterUrl = getPosterUrl(show?.poster_path ?? null);
  const backdropUrl = getBackdropUrl(show?.backdrop_path ?? null);

  function openEpisode(episode: TMDBEpisode) {
    router.push({
      pathname: '/show/[id]/season/[seasonNumber]/episode/[episodeNumber]',
      params: {
        id: String(showId),
        seasonNumber: String(episode.season_number),
        episodeNumber: String(episode.episode_number),
      },
    });
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}>
      {status === 'success' && show && backdropUrl ? (
        <ThemedView style={styles.backdropFrame}>
          <Image
            source={{ uri: backdropUrl }}
            style={styles.backdrop}
            contentFit="cover"
            contentPosition="top center"
            alt={`${show.name} backdrop`}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', theme.background]}
            locations={[0, 1]}
            style={styles.backdropFade}
          />
        </ThemedView>
      ) : null}

      <SafeAreaView style={styles.safeArea}>
        {hasValidShowId && (status === 'loading' || !isCurrentShowLoaded) ? <ShowDetailSkeleton /> : null}

        {!hasValidShowId || status === 'error' ? (
          <ThemedView type="backgroundElement" style={[styles.stateCard, { borderColor: theme.border }]}> 
            <ThemedText type="subtitle">Show unavailable</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              We could not load this show right now. Check your connection and try again.
            </ThemedText>
          </ThemedView>
        ) : null}

        {status === 'success' && show && isCurrentShowLoaded ? (
          <>
            <ThemedView style={styles.hero}> 
              {posterUrl ? (
                <Image source={{ uri: posterUrl }} style={styles.poster} contentFit="cover" alt={`${show.name} poster`} />
              ) : (
                <ThemedView type="backgroundSelected" style={styles.posterPlaceholder}>
                  <ThemedText type="small" themeColor="textSecondary">
                    No poster
                  </ThemedText>
                </ThemedView>
              )}

              <ThemedView type="backgroundElement" style={styles.heroText}>
                <ThemedText type="smallBold">{show.name}</ThemedText>
                <ThemedView style={styles.heroSubText}>
                <ThemedText type="small" themeColor="textSecondary">
                  {getYear(show.first_air_date)} · {show.vote_average.toFixed(1)}
                </ThemedText>
                <ShowStatusBadge status={userShow ? userShow.status : 'Not added'} />
                </ThemedView>
                <ThemedText type="small" themeColor="textSecondary">
                  {show.number_of_seasons ?? 0} seasons · {show.number_of_episodes ?? 0} episodes
                </ThemedText>
              </ThemedView>
            </ThemedView>

            {show.genres && show.genres.length > 0 ? (
              <ThemedView style={styles.genreRow}>
                {show.genres.slice(0, 4).map((genre) => (
                  <ThemedView key={genre.id} type="backgroundSelected" style={styles.genrePill}>
                    <ThemedText type="xs" themeColor="textSecondary">
                      {genre.name}
                    </ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
            ) : null}

            <ThemedView style={styles.overviewSection}> 
              <ThemedText themeColor="textSecondary" style={styles.overviewText}>
                {show.overview || 'No overview available yet.'}
              </ThemedText>
            </ThemedView>

            {show.seasons && show.seasons.length > 0 ? (
              <ThemedView style={styles.seasonsSection}> 
                <ThemedText type="smallBold">Track Episodes</ThemedText>
                {show.seasons
                  .filter((season) => season.season_number > 0)
                  .map((season) => (
                    <SeasonSummaryRow
                      key={season.season_number}
                      season={season}
                      showId={showId}
                      onEpisodePress={openEpisode}
                    />
                  ))}
              </ThemedView>
            ) : null}
          </>
        ) : null}
      </SafeAreaView>
    </ScrollView>
  );
}

function ShowStatusBadge({ status }: { status: string }) {
  const STATUS_COLORS: Record<ShowStatus, Record<string, string>> = {
    watching: { backgroundColor: "rgba(96, 165, 250, 0.1)", color: "rgb(96, 165, 250)" },
    want_to_watch: { backgroundColor: "rgba(139, 92, 246, 0.1)", color: "rgb(139, 92, 246)" },
    watched: { backgroundColor: "rgba(34, 197, 94, 0.1)", color: "rgb(34, 197, 94)" },
    dropped: { backgroundColor: "rgba(239, 68, 68, 0.1)", color: "rgb(239, 68, 68)" },
    on_hold: { backgroundColor: "rgba(250, 204, 21, 0.1)", color: "rgb(250, 204, 21)" },
  };

  const statusColor = STATUS_COLORS[status as ShowStatus] || { backgroundColor: "", color: "" };
  const statusLabel = STATUS_LABELS[status as ShowStatus] || status;

  return (
    <ThemedView>
      <ThemedText type="small" style={[styles.statusBadge, { backgroundColor: statusColor.backgroundColor, color: statusColor.color }]}>
        {statusLabel}
      </ThemedText>
    </ThemedView>
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
  skeletonBackdrop: {
    alignSelf: 'stretch',
    aspectRatio: 16 / 13,
    marginHorizontal: -Spacing.four,
    overflow: 'hidden',
  },
  skeletonBackdropFill: {
    width: '100%',
    height: '100%',
  },
  skeletonHeroCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Spacing.four,
    marginTop: -Spacing.six,
  },
  skeletonPoster: {
    width: 110,
    height: 165,
    borderRadius: Spacing.two,
  },
  skeletonHeroText: {
    flex: 1,
    gap: Spacing.two,
  },
  skeletonTitle: {
    width: '90%',
    height: 32,
    borderRadius: Spacing.two,
  },
  skeletonMeta: {
    width: '72%',
    height: 16,
    borderRadius: Spacing.two,
  },
  skeletonMetaShort: {
    width: '56%',
    height: 16,
    borderRadius: Spacing.two,
  },
  skeletonGenreRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  skeletonGenrePill: {
    width: 84,
    height: 28,
    borderRadius: Spacing.five,
  },
  skeletonGenrePillShort: {
    width: 64,
    height: 28,
    borderRadius: Spacing.five,
  },
  skeletonContentCard: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  skeletonSectionTitle: {
    width: 140,
    height: 24,
    borderRadius: Spacing.two,
  },
  skeletonLine: {
    width: '100%',
    height: 14,
    borderRadius: Spacing.two,
  },
  skeletonLineShort: {
    width: '68%',
    height: 14,
    borderRadius: Spacing.two,
  },
  skeletonSeasonRow: {
    width: '100%',
    height: 58,
    borderRadius: Spacing.three,
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
  hero: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.three,
    marginTop: -Spacing.six,
    backgroundColor: 'transparent',
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
    gap: Spacing.one,
    paddingRight: Spacing.two,
    backgroundColor: 'transparent',
  },
  heroSubText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statusBadge: {
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderWidth: 1,
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
  overviewSection: {
    alignSelf: 'stretch',
    paddingVertical: Spacing.two,
  },
  overviewText: {
    lineHeight: 20,
    fontSize: 14,
    fontWeight: 500,
  },
  seasonsSection: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  seasonsHeader: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.one,
    paddingBottom: Spacing.one,
  },
});