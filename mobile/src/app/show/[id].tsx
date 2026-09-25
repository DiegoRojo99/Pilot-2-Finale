import { useEffect, useState, useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, TextInput, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Skeleton } from '@/components/ui/skeleton';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getShowDetails, getUserShowDetails, getSeasonDetails, addShow, removeShow, updateShowStatus } from '@/lib/shows';
import { getShowEpisodeLogs, logEpisode, logEpisodesBulk } from '@/lib/episodes';
import { getBackdropUrl, getPosterUrl, getYear } from '@/lib/tmdb-images';
import { STATUS_LABELS, type ShowStatus, type TMDBEpisode, type TMDBShow, type UserShow, type TMDBSeason, type TMDBSeasonSummary } from '@/types/api';
import { type EpisodeLog } from '@/types/episode';

type DetailStatus = 'loading' | 'success' | 'error';

function episodeKey(season: number, episode: number): string {
  return `${season}-${episode}`;
}

type EpisodeRowProps = {
  episode: TMDBEpisode;
  isWatched: boolean;
  onToggle: () => void;
  onPress: (season: number, episode: number) => void;
};

function EpisodeRow({ episode, isWatched, onToggle, onPress }: EpisodeRowProps) {
  const theme = useTheme();
  
  return (
    <ThemedView style={[styles.episodeRow, { borderBottomColor: theme.border }]}>
      <TouchableOpacity
        style={styles.episodeImageContainer}
        activeOpacity={0.7}
        onPress={() => onPress(episode.season_number, episode.episode_number)}
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
                {new Date(episode.air_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </ThemedText>
            )}
            {episode.vote_average > 0 && (
              <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>
                ⭐ {episode.vote_average.toFixed(1)}
              </ThemedText>
            )}
          </ThemedView>
        </ThemedView>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        style={styles.episodeCheckboxContainer}
      >
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
    </ThemedView>
  );
}

function SeasonAccordion({
  showId,
  season,
  watchedCount,
  watchedSet,
  onToggleEpisode,
  onPressEpisode,
  onMarkSeasonAll,
  getCachedSeasonDetails,
}: {
  showId: number;
  season: TMDBSeasonSummary;
  watchedCount: number;
  watchedSet: Set<string>;
  onToggleEpisode: (episode: TMDBEpisode) => void;
  onPressEpisode: (season: number, episode: number) => void;
  onMarkSeasonAll: (seasonNumber: number) => void;
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
          {effectiveWatchedCount < episodeCount && (
            <TouchableOpacity
              style={[
                styles.markAllButton,
                { 
                  borderColor: theme.border,
                  opacity: isLoading ? 0.5 : 1,
                }
              ]}
              onPress={(e) => {
                e.stopPropagation?.();
                onMarkSeasonAll(season.season_number);
              }}
              activeOpacity={0.6}
              disabled={isLoading}
            />
          )}
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
              onPress={() => onPressEpisode(episode.season_number, episode.episode_number)}
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
  const router = useRouter();
  const [status, setStatus] = useState<DetailStatus>('loading');
  const [show, setShow] = useState<TMDBShow | null>(null);
  const [userShow, setUserShow] = useState<UserShow | null>(null);
  const [episodeLogs, setEpisodeLogs] = useState<EpisodeLog[]>([]);
  const [loadedShowId, setLoadedShowId] = useState<number | null>(null);
  const [seasonDataCache, setSeasonDataCache] = useState<Map<string, TMDBSeason>>(new Map());
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);
  const [selectedEpisodeForDiary, setSelectedEpisodeForDiary] = useState<TMDBEpisode | null>(null);
  const [diaryDate, setDiaryDate] = useState(''); // Format: 'YYYY-MM-DD'
  const [diaryRating, setDiaryRating] = useState<number>(0);
  const [isDiarySaving, setIsDiarySaving] = useState(false);
  const [bulkMarkConfirm, setBulkMarkConfirm] = useState<{ seasonNumber: number; count: number; seasonData?: TMDBSeason } | null>(null);
  const [isBulkMarking, setIsBulkMarking] = useState(false);
  const [isLoadingSeasonForBulk, setIsLoadingSeasonForBulk] = useState(false);
  const [markPreviousConfirm, setMarkPreviousConfirm] = useState<{
    seasonNumber: number;
    episodeNumber: number;
    episodeName: string;
    tmdbEpisodeId?: number;
    count: number;
  } | null>(null);
  const [isMarkingPrevious, setIsMarkingPrevious] = useState(false);
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
    const isCurrentlyWatched = watchedSet.has(episodeKey(episode.season_number, episode.episode_number));
    
    // If unmarking or already loading, just open the diary modal
    if (isCurrentlyWatched || isLoadingSeasonForBulk || isBulkMarking || isMarkingPrevious) {
      setSelectedEpisodeForDiary(episode);
      setDiaryDate(new Date().toISOString().split('T')[0]);
      setDiaryRating(0);
      setIsDiaryModalOpen(true);
      return;
    }

    // Try to load season data to check for previous unwatched episodes
    try {
      setIsLoadingSeasonForBulk(true);
      const seasonData = await getCachedSeasonDetails(episode.season_number);
      if (!seasonData?.episodes?.length) return;
      
      const previousUnwatched = seasonData.episodes.filter(
        (ep) =>
          ep.episode_number < episode.episode_number &&
          !watchedSet.has(episodeKey(ep.season_number, ep.episode_number))
      );

      if (previousUnwatched.length > 0) {
        setMarkPreviousConfirm({
          seasonNumber: episode.season_number,
          episodeNumber: episode.episode_number,
          episodeName: episode.name,
          tmdbEpisodeId: episode.id,
          count: previousUnwatched.length,
        });
        return;
      }
    } catch (error) {
      console.error('Failed to load season for previous episodes check:', error);
    } finally {
      setIsLoadingSeasonForBulk(false);
    }

    // No previous unwatched episodes, just open diary modal
    setSelectedEpisodeForDiary(episode);
    setDiaryDate(new Date().toISOString().split('T')[0]);
    setDiaryRating(0);
    setIsDiaryModalOpen(true);
  };

  const redirectToEpisode = (season: number, episode: number) => {
    router.push(`/show/${showId}/season/${season}/episode/${episode}`);
  };

  const handleDiarySave = async () => {
    if (!selectedEpisodeForDiary) return;
    
    const key = episodeKey(selectedEpisodeForDiary.season_number, selectedEpisodeForDiary.episode_number);
    const isCurrentlyWatched = watchedSet.has(key);
    
    // Optimistic update: update UI immediately
    const previousLogs = episodeLogs;
    
    // Remove from watched
    if (isCurrentlyWatched) {
      setEpisodeLogs((prev) =>
        prev.filter(
          (log) =>
            !(log.season_number === selectedEpisodeForDiary.season_number && log.episode_number === selectedEpisodeForDiary.episode_number)
        )
      );
    }
    // Add to watched
    else {
      const watchedAt = diaryDate ? new Date(diaryDate).toISOString() : new Date().toISOString();
      const newLog: EpisodeLog = {
        id: Date.now(),
        tmdb_show_id: showId,
        season_number: selectedEpisodeForDiary.season_number,
        episode_number: selectedEpisodeForDiary.episode_number,
        episode_name: selectedEpisodeForDiary.name,
        watched_at: watchedAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        rating: diaryRating > 0 ? diaryRating : null,
        notes: null,
      };
      setEpisodeLogs((prev) => [...prev, newLog]);
    }
    
    setIsDiarySaving(true);
    try {
      const watchedAt = isCurrentlyWatched ? null : (diaryDate ? new Date(diaryDate).toISOString() : new Date().toISOString());
      
      await logEpisode({
        tmdb_show_id: showId,
        tmdb_episode_id: selectedEpisodeForDiary.id,
        season_number: selectedEpisodeForDiary.season_number,
        episode_number: selectedEpisodeForDiary.episode_number,
        episode_name: selectedEpisodeForDiary.name,
        watched_at: watchedAt,
        rating: diaryRating > 0 ? diaryRating : undefined,
      });
      
      setIsDiaryModalOpen(false);
      setSelectedEpisodeForDiary(null);
    } catch (error) {
      console.error('Error saving episode diary:', error);
      setEpisodeLogs(previousLogs);
    } finally {
      setIsDiarySaving(false);
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

  const handleConfirmMarkPrevious = async () => {
    if (!markPreviousConfirm || !show) return;

    const { seasonNumber, episodeNumber, episodeName, tmdbEpisodeId, count } = markPreviousConfirm;
    const season = show.seasons?.find(s => s.season_number === seasonNumber);
    if (!season) return;

    const seasonData = seasonDataCache.get(`${showId}-${seasonNumber}`);
    if (!seasonData?.episodes) return;

    const previousUnwatched = seasonData.episodes.filter(
      (ep) =>
        ep.episode_number < episodeNumber &&
        !watchedSet.has(episodeKey(ep.season_number, ep.episode_number))
    );

    if (previousUnwatched.length === 0) return;

    setIsMarkingPrevious(true);
    const previousLogs = episodeLogs;

    try {
      // Optimistic update
      const newLogs = previousUnwatched.map(ep => ({
        id: Date.now() + Math.random(),
        tmdb_show_id: showId,
        season_number: ep.season_number,
        episode_number: ep.episode_number,
        episode_name: ep.name,
        watched_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        rating: null,
        notes: null,
      }));
      setEpisodeLogs((prev) => [...prev, ...newLogs]);

      // API call
      await logEpisodesBulk({
        tmdb_show_id: showId,
        episodes: previousUnwatched.map(ep => ({
          tmdb_episode_id: ep.id,
          season_number: ep.season_number,
          episode_number: ep.episode_number,
          episode_name: ep.name,
          watched_at: null,
        })),
      });

      // Now open the diary modal for the current episode
      setMarkPreviousConfirm(null);
      setSelectedEpisodeForDiary({
        id: tmdbEpisodeId || 0,
        season_number: seasonNumber,
        episode_number: episodeNumber,
        name: episodeName,
        overview: '',
        still_path: null,
        air_date: '',
        vote_average: 0,
        runtime: 0,
      } as TMDBEpisode);
      setDiaryDate(new Date().toISOString().split('T')[0]);
      setDiaryRating(0);
      setIsDiaryModalOpen(true);
    } catch (error) {
      console.error('Error marking previous episodes:', error);
      setEpisodeLogs(previousLogs);
    } finally {
      setIsMarkingPrevious(false);
    }
  };

  const handleCancelMarkPrevious = () => {
    if (!markPreviousConfirm) return;
    
    // Open diary modal for the current episode without marking previous ones
    const { seasonNumber, episodeNumber, episodeName, tmdbEpisodeId } = markPreviousConfirm;
    
    setMarkPreviousConfirm(null);
    setSelectedEpisodeForDiary({
      id: tmdbEpisodeId || 0,
      season_number: seasonNumber,
      episode_number: episodeNumber,
      name: episodeName,
      overview: '',
      still_path: null,
      air_date: '',
      vote_average: 0,
      runtime: 0,
    } as TMDBEpisode);
    setDiaryDate(new Date().toISOString().split('T')[0]);
    setDiaryRating(0);
    setIsDiaryModalOpen(true);
  };

  const handleMarkSeasonAll = async (seasonNumber: number) => {
    if (!show || isLoadingSeasonForBulk || isBulkMarking) return;
    
    const season = show.seasons?.find(s => s.season_number === seasonNumber);
    if (!season) return;

    const episodeCount = season.episode_count ?? 0;
    const watchedCount = watchedCountBySeason.get(seasonNumber) ?? 0;
    const remainingCount = episodeCount - watchedCount;

    if (remainingCount <= 0) return;

    // Load season data if not already cached
    setIsLoadingSeasonForBulk(true);
    try {
      const seasonData = await getCachedSeasonDetails(seasonNumber);
      setBulkMarkConfirm({ seasonNumber, count: remainingCount, seasonData });
    } catch (error) {
      console.error('Failed to load season for bulk marking:', error);
    } finally {
      setIsLoadingSeasonForBulk(false);
    }
  };

  const handleConfirmBulkMark = async () => {
    if (!bulkMarkConfirm || !show) return;

    const { seasonNumber, count, seasonData: passedSeasonData } = bulkMarkConfirm;
    const season = show.seasons?.find(s => s.season_number === seasonNumber);
    if (!season) return;

    // Use passed seasonData from handleMarkSeasonAll, or fall back to cache
    const seasonData = passedSeasonData || seasonDataCache.get(`${showId}-${seasonNumber}`);
    if (!seasonData?.episodes) return;

    const unwatchedEpisodes = seasonData.episodes.filter(
      (ep) => !watchedSet.has(episodeKey(ep.season_number, ep.episode_number))
    );

    if (unwatchedEpisodes.length === 0) return;

    setIsBulkMarking(true);
    const previousLogs = episodeLogs;

    try {
      // Optimistic update
      const newLogs = unwatchedEpisodes.map(ep => ({
        id: Date.now() + Math.random(),
        tmdb_show_id: showId,
        season_number: ep.season_number,
        episode_number: ep.episode_number,
        episode_name: ep.name,
        watched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        rating: null,
        notes: null,
      }));
      setEpisodeLogs((prev) => [...prev, ...newLogs]);

      // API call
      await logEpisodesBulk({
        tmdb_show_id: showId,
        episodes: unwatchedEpisodes.map(ep => ({
          tmdb_episode_id: ep.id,
          season_number: ep.season_number,
          episode_number: ep.episode_number,
          episode_name: ep.name,
          watched_at: new Date().toISOString(),
        })),
      });

      setBulkMarkConfirm(null);
    } catch (error) {
      console.error('Error bulk marking episodes:', error);
      setEpisodeLogs(previousLogs);
    } finally {
      setIsBulkMarking(false);
    }
  };

  const posterUrl = getPosterUrl(show?.poster_path ?? null);
  const backdropUrl = getBackdropUrl(show?.backdrop_path ?? null);

  return (
    <SafeAreaView edges={['bottom']} style={styles.scrollView}>
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

        <View style={styles.safeArea}>
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
                        onPressEpisode={redirectToEpisode}
                        onMarkSeasonAll={handleMarkSeasonAll}
                        getCachedSeasonDetails={getCachedSeasonDetails}
                      />
                    ))}
                </ThemedView>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>

      {isDiaryModalOpen && selectedEpisodeForDiary && (
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="smallBold">Log Episode Watch</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
              {show?.name} - S{String(selectedEpisodeForDiary.season_number).padStart(2, '0')} E{String(selectedEpisodeForDiary.episode_number).padStart(2, '0')} - {selectedEpisodeForDiary.name}
            </ThemedText>

            <View style={styles.modalInputs}>
              <View>
                <ThemedText type="small" style={{ marginBottom: Spacing.one }}>Watched date (optional)</ThemedText>
                <TextInput
                  style={[
                    styles.modalInput,
                    { 
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                      paddingHorizontal: Spacing.two,
                      color: theme.text,
                    }
                  ]}
                  value={diaryDate}
                  onChangeText={setDiaryDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View>
                <ThemedText type="small" style={{ marginBottom: Spacing.one }}>Rating 0-10 (optional)</ThemedText>
                <View style={{ gap: Spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                    <ThemedText type="small" style={{ fontSize: 14, fontWeight: '600' }}>
                      {diaryRating > 0 ? diaryRating.toFixed(1) : '0.0'} / 10
                    </ThemedText>
                  </View>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={0}
                    maximumValue={10}
                    value={diaryRating}
                    onValueChange={setDiaryRating}
                    step={0.1}
                    minimumTrackTintColor={theme.accent}
                    maximumTrackTintColor={theme.border}
                    thumbTintColor={theme.accent}
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
                onPress={() => {
                  setIsDiaryModalOpen(false);
                  setSelectedEpisodeForDiary(null);
                  setDiaryDate(new Date().toISOString().split('T')[0]);
                  setDiaryRating(0);
                }}
                disabled={isDiarySaving}
              >
                <ThemedText type="small">Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.accent }]}
                onPress={handleDiarySave}
                disabled={isDiarySaving}
              >
                <ThemedText type="small" style={{ color: theme.accentText }}>
                  {isDiarySaving ? 'Saving...' : 'Save'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {bulkMarkConfirm && (
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="smallBold">Mark Episodes as Watched?</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one, marginBottom: Spacing.three }}>
              You're about to mark {bulkMarkConfirm.count} {bulkMarkConfirm.count === 1 ? 'episode' : 'episodes'} as watched.
            </ThemedText>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
                onPress={() => setBulkMarkConfirm(null)}
                disabled={isBulkMarking}
              >
                <ThemedText type="small">Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.accent }]}
                onPress={handleConfirmBulkMark}
                disabled={isBulkMarking}
              >
                <ThemedText type="small" style={{ color: theme.accentText }}>
                  {isBulkMarking ? 'Adding...' : 'Mark All'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {markPreviousConfirm && (
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="smallBold">Mark Previous Episodes?</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one, marginBottom: Spacing.three }}>
              You're marking episode {markPreviousConfirm.episodeNumber} as watched. Would you also like to mark the {markPreviousConfirm.count} earlier {markPreviousConfirm.count === 1 ? 'episode' : 'episodes'} as watched?
            </ThemedText>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}
                onPress={handleCancelMarkPrevious}
                disabled={isMarkingPrevious}
              >
                <ThemedText type="small">Skip</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.accent }]}
                onPress={handleConfirmMarkPrevious}
                disabled={isMarkingPrevious}
              >
                <ThemedText type="small" style={{ color: theme.accentText }}>
                  {isMarkingPrevious ? 'Adding...' : 'Mark All'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
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
    marginTop: -Spacing.seven,
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
    marginTop: -Spacing.seven,
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
  markAllButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  episodeImageContainer: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  episodeCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    borderRadius: Spacing.four,
    borderWidth: 1,
    padding: Spacing.four,
    width: '85%',
    maxWidth: 320,
  },
  modalInputs: {
    gap: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  modalButton: {
    flex: 1,
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingInput: {
    fontSize: 16,
    padding: 0,
    flex: 1,
  },
  datePickerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginHorizontal: -Spacing.four,
    marginBottom: -Spacing.four,
    borderBottomLeftRadius: Spacing.four,
    borderBottomRightRadius: Spacing.four,
    overflow: 'hidden',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  datePickerContent: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    marginBottom: Spacing.five,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  datePickerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});