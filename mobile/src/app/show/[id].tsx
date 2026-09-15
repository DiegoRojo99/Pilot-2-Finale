import { useEffect, useState, useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Skeleton } from '@/components/ui/skeleton';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getShowDetails, getUserShowDetails, getSeasonDetails, addShow, removeShow, updateShowStatus } from '@/lib/shows';
import { getShowEpisodeLogs, logEpisode } from '@/lib/episodes';
import { getBackdropUrl, getPosterUrl, getYear } from '@/lib/tmdb-images';
import { STATUS_LABELS, type ShowStatus, type TMDBEpisode, type TMDBShow, type UserShow, type TMDBSeason, type TMDBSeasonSummary, type EpisodeLog } from '@/types/api';

type DetailStatus = 'loading' | 'success' | 'error';

function episodeKey(season: number, episode: number): string {
  return `${season}-${episode}`;
}

type EpisodeRowProps = {
  episode: TMDBEpisode;
  isWatched: boolean;
  onToggle: () => void;
};

function EpisodeRow({ episode, isWatched, onToggle }: EpisodeRowProps) {
  const theme = useTheme();
  
  return (
    <TouchableOpacity 
      style={[styles.episodeRow, { borderBottomColor: theme.border }]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      {episode.still_path && getBackdropUrl(episode.still_path) ? (
        <Image
          source={{ uri: getBackdropUrl(episode.still_path) || '' }}
          style={styles.episodeImage}
          contentFit="cover"
        />
      ) : (
        <ThemedView type="backgroundSelected" style={styles.episodeImagePlaceholder}>
          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 9, lineHeight: 12 }}>
            No image
          </ThemedText>
        </ThemedView>
      )}
      
      <ThemedView style={styles.episodeContentContainer}>
        <ThemedView style={styles.episodeTopRow}>
          <ThemedText type="small" themeColor="textSecondary" style={{ marginRight: Spacing.one }}>
            {String(episode.episode_number).padStart(2, '0')}
          </ThemedText>
          <ThemedText 
            type="small" 
            style={{ 
              flex: 1,
              color: isWatched ? theme.textSecondary : theme.text 
            }}
            numberOfLines={1}
          >
            {episode.name}
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.episodeMeta}>
          {episode.air_date && (
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
              {new Date(episode.air_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </ThemedText>
          )}
          {episode.vote_average > 0 && (
            <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
              ⭐ {episode.vote_average.toFixed(1)}
            </ThemedText>
          )}
        </ThemedView>
      </ThemedView>
      
      <ThemedView
        style={[
          styles.episodeCheckbox,
          { 
            borderColor: isWatched ? theme.success : theme.border,
            backgroundColor: isWatched ? theme.success : 'transparent'
          }
        ]}
      >
        {isWatched && <ThemedText style={{ fontSize: 16, lineHeight: 16, marginTop: -2, color: 'white' }}>✓</ThemedText>}
      </ThemedView>
    </TouchableOpacity>
  );
}

function SeasonAccordion({
  showId,
  season,
  watchedCount,
  watchedSet,
  onToggleEpisode,
  getCachedSeasonDetails,
}: {
  showId: number;
  season: TMDBSeasonSummary;
  watchedCount: number;
  watchedSet: Set<string>;
  onToggleEpisode: (episode: TMDBEpisode) => void;
  getCachedSeasonDetails: (seasonNumber: number) => Promise<TMDBSeason>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [seasonData, setSeasonData] = useState<TMDBSeason | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();
  
  const episodeCount = season.episode_count ?? 0;
  
  // Calculate effective watched count based on loaded season data
  const loadedWatchedCount = seasonData?.episodes
    ?.filter((episode) => watchedSet.has(episodeKey(episode.season_number, episode.episode_number)))
    .length ?? 0;
  const effectiveWatchedCount = seasonData ? loadedWatchedCount : watchedCount;
  const progressPercent = episodeCount > 0 ? (effectiveWatchedCount / episodeCount) * 100 : 0;

  const handleExpandPress = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }

    // Load season details only when expanded
    if (!seasonData && !isLoading) {
      setIsLoading(true);
      try {
        const details = await getCachedSeasonDetails(season.season_number);
        setSeasonData(details);
      } catch (error) {
        console.error('Failed to load season episodes:', error);
      } finally {
        setIsLoading(false);
      }
    }

    setExpanded(true);
  };

  const episodes = seasonData?.episodes ?? [];

  return (
    <ThemedView 
      type="backgroundElement"
      style={[styles.seasonAccordion, { borderColor: theme.border }]}
    >
      <TouchableOpacity
        style={styles.seasonHeader}
        onPress={handleExpandPress}
        activeOpacity={0.7}
      >
        <ThemedView style={styles.seasonLeftContent}>
          <ThemedText type="smallBold">{season.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 2 }}>
            {effectiveWatchedCount}/{episodeCount} episodes
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.seasonRightContent}>
          <View style={[styles.progressBar, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent}%`, backgroundColor: theme.success }
              ]}
            />
          </View>
          <View style={{ width: 16, height: 16, justifyContent: 'center', alignItems: 'center' }}>
            {expanded ? (
              <ThemedText style={{ fontSize: 12, lineHeight: 12 }}>−</ThemedText>
            ) : (
              <ThemedText style={{ fontSize: 12, lineHeight: 12 }}>+</ThemedText>
            )}
          </View>
        </ThemedView>
      </TouchableOpacity>

      {expanded && (
        <ThemedView style={[styles.episodesList, { borderTopColor: theme.border }]}>
          {isLoading && (
            <ThemedView style={styles.loadingContainer}>
              <ThemedText type="small" themeColor="textSecondary">Loading episodes…</ThemedText>
            </ThemedView>
          )}

          {episodes.map((episode) => (
            <EpisodeRow
              key={episode.id}
              episode={episode}
              isWatched={watchedSet.has(episodeKey(episode.season_number, episode.episode_number))}
              onToggle={() => onToggleEpisode(episode)}
            />
          ))}
        </ThemedView>
      )}
    </ThemedView>
  );
}

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
  const { id } = useLocalSearchParams<{ id: string }>();
  const [status, setStatus] = useState<DetailStatus>('loading');
  const [show, setShow] = useState<TMDBShow | null>(null);
  const [userShow, setUserShow] = useState<UserShow | null>(null);
  const [episodeLogs, setEpisodeLogs] = useState<EpisodeLog[]>([]);
  const [loadedShowId, setLoadedShowId] = useState<number | null>(null);
  const [seasonDataCache, setSeasonDataCache] = useState<Map<string, TMDBSeason>>(new Map());
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const theme = useTheme();
  const showId = Number(id);
  const hasValidShowId = Number.isFinite(showId);
  const isCurrentShowLoaded = loadedShowId === showId;

  const watchedSet = useMemo(() => {
    const set = new Set<string>();
    episodeLogs.forEach((log) => set.add(episodeKey(log.season_number, log.episode_number)));
    return set;
  }, [episodeLogs]);

  const watchedCountBySeason = useMemo(() => {
    const counts = new Map<number, number>();
    episodeLogs.forEach((log) => {
      const current = counts.get(log.season_number) ?? 0;
      counts.set(log.season_number, current + 1);
    });
    return counts;
  }, [episodeLogs]);

  useEffect(() => {
    if (!hasValidShowId) return;
    let isMounted = true;

    const loadShowData = async () => {
      try {
        const [showDetails, myShow] = await Promise.all([
          getShowDetails(showId),
          getUserShowDetails(showId).catch(() => null),
        ]);

        if (!isMounted) return;
        setShow(showDetails);
        setUserShow(myShow);
        setLoadedShowId(showId);
        
        // Fetch episode logs if user has added the show
        if (myShow) {
          try {
            const logs = await getShowEpisodeLogs(showId);
            if (isMounted) setEpisodeLogs(logs);
          } 
          catch {
            // Episode logs fetch failed, continue anyway
          }
        }
        
        setStatus('success');
      } catch (error) {
        if (!isMounted) return;
        console.error('Error loading show:', error);
        setShow(null);
        setUserShow(null);
        setStatus('error');
      }
    };

    void loadShowData();
    return () => { isMounted = false; };
  }, [hasValidShowId, showId]);

  const getCachedSeasonDetails = async (seasonNumber: number) => {
    const cacheKey = `${showId}-${seasonNumber}`;
    const cachedSeason = seasonDataCache.get(cacheKey);
    if (cachedSeason) return cachedSeason;

    const seasonData = await getSeasonDetails(showId, seasonNumber);
    setSeasonDataCache((prev) => new Map(prev).set(cacheKey, seasonData));
    return seasonData;
  };

  const handleToggleEpisode = async (episode: TMDBEpisode) => {
    const key = episodeKey(episode.season_number, episode.episode_number);
    const isCurrentlyWatched = watchedSet.has(key);
    
    // Optimistic update: update UI immediately
    const previousLogs = episodeLogs;
    
    if (isCurrentlyWatched) {
      // Remove from watched
      setEpisodeLogs((prev) =>
        prev.filter(
          (log) =>
            !(log.season_number === episode.season_number && log.episode_number === episode.episode_number)
        )
      );
    } else {
      // Add to watched
      const newLog: EpisodeLog = {
        id: Date.now(), // Use timestamp as temporary ID
        tmdb_show_id: showId,
        season_number: episode.season_number,
        episode_number: episode.episode_number,
        episode_name: episode.name,
        watched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        rating: null,
        notes: null,
      };
      setEpisodeLogs((prev) => [...prev, newLog]);
    }
    
    // Then call API
    try {
      const watchedAt = isCurrentlyWatched ? null : new Date().toISOString();
      
      await logEpisode({
        tmdb_show_id: showId,
        tmdb_episode_id: episode.id,
        season_number: episode.season_number,
        episode_number: episode.episode_number,
        episode_name: episode.name,
        watched_at: watchedAt,
        rating: undefined,
      });
    } catch (error) {
      // Revert on error
      console.error('Error toggling episode:', error);
      setEpisodeLogs(previousLogs);
    }
  };

  const handleStatusChange = async (newStatus: ShowStatus) => {
    if (!show) return;

    try {
      if (!userShow) {
        // Add show with new status
        const added = await addShow({
          tmdb_id: show.id,
          name: show.name,
          poster_path: show.poster_path,
          backdrop_path: show.backdrop_path,
          overview: show.overview,
          first_air_date: show.first_air_date,
          vote_average: show.vote_average,
          number_of_seasons: show.number_of_seasons ?? 0,
          number_of_episodes: show.number_of_episodes ?? 0,
          status: newStatus,
        });
        setUserShow(added);
      } else {
        // Update existing status
        const updated = await updateShowStatus(showId, newStatus);
        setUserShow(updated);
      }
      setShowStatusMenu(false);
    } catch (error) {
      console.error('Error updating show status:', error);
    }
  };

  const handleRemoveShow = async () => {
    if (!userShow) return;

    try {
      await removeShow(showId);
      setUserShow(null);
      setEpisodeLogs([]);
      setShowStatusMenu(false);
    } catch (error) {
      console.error('Error removing show:', error);
    }
  };

  const posterUrl = getPosterUrl(show?.poster_path ?? null);
  const backdropUrl = getBackdropUrl(show?.backdrop_path ?? null);

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
                <Image source={{ uri: posterUrl }} style={styles.poster} contentFit="cover" />
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
                  <ShowStatusBadge status={userShow?.status ?? 'Not added'} />
                </ThemedView>
                <ThemedText type="small" themeColor="textSecondary">
                  {show.number_of_seasons ?? 0} seasons · {show.number_of_episodes ?? 0} episodes
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.statusPickerContainer}>
              <TouchableOpacity
                onPress={() => setShowStatusMenu(!showStatusMenu)}
                style={[styles.statusButton, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
              >
                <ThemedText type="small">
                  {userShow ? STATUS_LABELS[userShow.status] : 'Add to List'}
                </ThemedText>
              </TouchableOpacity>
              
              {showStatusMenu && (
                <View style={[styles.statusMenu, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  {(['watching', 'want_to_watch', 'watched', 'on_hold', 'dropped'] as ShowStatus[]).map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => handleStatusChange(s)}
                      style={[
                        styles.statusMenuItem,
                        userShow?.status === s && { backgroundColor: theme.accent }
                      ]}
                    >
                      <ThemedText
                        type="small"
                        style={{ color: userShow?.status === s ? theme.accentText : theme.text }}
                      >
                        {STATUS_LABELS[s]}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                  {userShow && (
                    <>
                      <View style={[styles.statusMenuDivider, { borderColor: theme.border }]} />
                      <TouchableOpacity
                        onPress={handleRemoveShow}
                        style={styles.statusMenuItem}
                      >
                        <ThemedText type="small" style={{ color: theme.danger }}>
                          Remove from list
                        </ThemedText>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
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

            {show.seasons && show.seasons.length > 0 && userShow ? (
              <ThemedView style={styles.seasonsSection}> 
                <ThemedText type="smallBold">Track Episodes</ThemedText>
                {show.seasons
                  .filter((season) => season.season_number > 0)
                  .map((seasonSummary) => (
                    <SeasonAccordion
                      key={seasonSummary.season_number}
                      showId={showId}
                      season={seasonSummary}
                      watchedCount={watchedCountBySeason.get(seasonSummary.season_number) ?? 0}
                      watchedSet={watchedSet}
                      onToggleEpisode={handleToggleEpisode}
                      getCachedSeasonDetails={getCachedSeasonDetails}
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
  statusPickerContainer: {
    alignSelf: 'stretch',
  },
  statusButton: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    height: 44,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statusMenu: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    marginTop: Spacing.one,
    overflow: 'hidden',
  },
  statusMenuItem: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  statusMenuDivider: {
    height: 1,
    borderBottomWidth: 1,
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
    fontWeight: '500',
  },
  seasonsSection: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  seasonAccordion: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.one,
  },
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  seasonLeftContent: {
    flex: 1,
    marginRight: Spacing.two,
    backgroundColor: 'transparent',
  },
  seasonRightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  progressBar: {
    width: 48,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  episodesList: {
    borderTopWidth: 1,
  },
  loadingContainer: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  episodeImage: {
    width: 56,
    height: 42,
    borderRadius: Spacing.one,
  },
  episodeImagePlaceholder: {
    width: 56,
    height: 42,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeContentContainer: {
    flex: 1,
    gap: Spacing.one,
  },
  episodeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  episodeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginLeft: 4,
  },
  episodeCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});