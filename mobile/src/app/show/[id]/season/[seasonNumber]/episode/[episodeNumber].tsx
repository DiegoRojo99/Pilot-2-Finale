import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Skeleton } from '@/components/ui/skeleton';
import { EpisodeDiaryModal } from '@/components/show/episode-diary-modal';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getSeasonDetails } from '@/lib/shows';
import { getStillUrl } from '@/lib/tmdb-images';
import type { TMDBEpisode } from '@/types/api';

type EpisodeStatus = 'loading' | 'success' | 'error';

function EpisodeDetailSkeleton() {
  return (
    <>
      <Skeleton style={{ width: 180, height: 20, borderRadius: Spacing.two, marginBottom: Spacing.md }} />
      <Skeleton style={styles.skeletonTitle} />
      <View style={{ flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.lg }}>
        <Skeleton style={{ width: 120, height: 16, borderRadius: Spacing.two }} />
        <Skeleton style={{ width: 80, height: 16, borderRadius: Spacing.two }} />
      </View>
      <Skeleton style={{ width: '100%', height: 44, borderRadius: Spacing.two, marginBottom: Spacing.lg }} />
      
      <Skeleton style={styles.skeletonSectionTitle} />
      <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
        <Skeleton style={styles.skeletonLine} />
        <Skeleton style={styles.skeletonLine} />
        <Skeleton style={styles.skeletonLineShort} />
      </View>
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
  const [loadedEpisodeKey, setLoadedEpisodeKey] = useState<string | null>(null);
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const theme = useTheme();
  const showId = Number(id);
  const selectedSeasonNumber = Number(seasonNumber);
  const selectedEpisodeNumber = Number(episodeNumber);
  const episodeKey = `${showId}-${selectedSeasonNumber}-${selectedEpisodeNumber}`;
  const hasValidParams = Number.isFinite(showId) && Number.isFinite(selectedSeasonNumber) && Number.isFinite(selectedEpisodeNumber);
  const isCurrentEpisodeLoaded = loadedEpisodeKey === episodeKey;

  useEffect(() => {
    if (!hasValidParams) return;
    let isMounted = true;

    void getSeasonDetails(showId, selectedSeasonNumber)
      .then((season) => {
        if (!isMounted) return;
        const foundEpisode = season.episodes?.find((item) => item.episode_number === selectedEpisodeNumber) ?? null;
        setEpisode(foundEpisode);
        setLoadedEpisodeKey(foundEpisode ? episodeKey : null);
        setStatus(foundEpisode ? 'success' : 'error');
      })
      .catch(() => {
        if (!isMounted) return;
        setEpisode(null);
        setLoadedEpisodeKey(null);
        setStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, [episodeKey, hasValidParams, selectedEpisodeNumber, selectedSeasonNumber, showId]);

  const stillUrl = getStillUrl(episode?.still_path ?? null);
  const episodeLabel = `S${String(selectedSeasonNumber).padStart(2, '0')}E${String(selectedEpisodeNumber).padStart(2, '0')}`;

  return (
    <>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}>
        {status === 'success' && episode && stillUrl ? (
          <View style={styles.stillFrameContainer}>
            <Image source={{ uri: stillUrl }} style={styles.still} alt={episode.name} />
            <LinearGradient
              colors={['transparent', theme.background]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.stillGradient}
            />
          </View>
        ) : null}

        {status === 'success' && episode && isCurrentEpisodeLoaded ? (
          <View style={styles.episodeHeaderContainer}>
            <ThemedText type="title" style={[styles.episodeTitleText, { color: theme.text }]}>
              {episode.name}
            </ThemedText>
            <ThemedText type="small" style={[styles.episodeKeyText, { color: theme.textSecondary }]}>
              S{String(episode.season_number).padStart(2, '0')} E{String(episode.episode_number).padStart(2, '0')}
            </ThemedText>
            <EpisodeDetails episode={episode} onLogPress={() => setIsDiaryOpen(true)} />
          </View>
        ) : null}

        <SafeAreaView style={styles.safeArea}>
          {hasValidParams && (status === 'loading' || !isCurrentEpisodeLoaded) ? <EpisodeDetailSkeleton /> : null}

          {!hasValidParams || status === 'error' ? (
            <ThemedView type="backgroundElement" style={[styles.stateCard, { borderColor: theme.border }]}> 
              <ThemedText type="subtitle">Episode unavailable</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                We could not load this episode right now. Check your connection and try again.
              </ThemedText>
            </ThemedView>
          ) : null}
        </SafeAreaView>
      </ScrollView>

      {episode && (
        <EpisodeDiaryModal
          isOpen={isDiaryOpen}
          episodeLabel={episodeLabel}
          episodeName={episode.name}
          isPending={false}
          title="Log Episode"
          submitLabel="Log"
          onSubmit={async () => {
            setIsDiaryOpen(false);
          }}
          onCancel={() => setIsDiaryOpen(false)}
        />
      )}
    </>
  );
}

function EpisodeDetails({ episode, onLogPress }: { episode: TMDBEpisode; onLogPress: () => void }) {
  const theme = useTheme();
  
  return (
    <>
      <View style={styles.metadataRow}>
        {episode.air_date && (
          <View style={styles.metadataItem}>
            <Ionicons name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.metadataText}>
              {new Date(episode.air_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </ThemedText>
          </View>
        )}
        {episode.runtime && (
          <View style={styles.metadataItem}>
            <Ionicons name="time" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.metadataText}>
              {episode.runtime}m
            </ThemedText>
          </View>
        )}
        {episode.vote_average > 0 && (
          <View style={styles.metadataItem}>
            <Ionicons name="star" size={14} color="#fbbf24" />
            <ThemedText type="small" style={[styles.metadataText, { color: '#fbbf24' }]}>
              {episode.vote_average.toFixed(1)}
            </ThemedText>
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={onLogPress}
        activeOpacity={0.7}
        style={[styles.logButton, { backgroundColor: theme.accent }]}
      >
        <Ionicons name="add-circle-outline" size={16} color={theme.accentText} />
        <ThemedText type="small" style={[styles.logButtonText, { color: theme.accentText }]}>
          Log Episode
        </ThemedText>
      </TouchableOpacity>

      {episode.overview && (
        <View style={styles.synopsisSection}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            SYNOPSIS
          </ThemedText>
          <ThemedText type="small" style={[styles.synopsisText, { color: theme.text }]}>
            {episode.overview}
          </ThemedText>
        </View>
      )}
    </>
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
  stillFrameContainer: {
    width: '100%',
    aspectRatio: 1.5 / 1,
    overflow: 'hidden',
    position: 'relative',
  },
  still: {
    width: '100%',
    height: '100%',
  },
  stillGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  episodeHeaderContainer: {
    width: '100%',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.md,
    marginTop: -Spacing.six,
    marginBottom: Spacing.four,
    gap: Spacing.sm,
  },
  episodeKeyBadge: {
    left: Spacing.four,
    zIndex: 10,
  },
  episodeKeyText: {
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  episodeTitleOverlay: {
    left: Spacing.four,
    right: Spacing.four,
    zIndex: 10,
  },
  episodeTitleText: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: 0,
    paddingBottom: Spacing.four,
  },
  stateCard: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 1,
  },
  skeletonStillFrame: {
    alignSelf: 'stretch',
    aspectRatio: 2 / 1,
    marginHorizontal: -Spacing.four,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  skeletonStill: {
    width: '100%',
    height: '100%',
  },
  skeletonHeaderCard: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    paddingVertical: Spacing.md,
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
    marginVertical: Spacing.sm,
  },
  skeletonMetaShort: {
    width: 140,
    height: 16,
    borderRadius: Spacing.two,
  },
  skeletonOverviewCard: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    paddingVertical: Spacing.md,
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
    marginBottom: Spacing.sm,
  },
  skeletonLineShort: {
    width: '64%',
    height: 14,
    borderRadius: Spacing.two,
  },
  episodeNumber: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  episodeTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    flexWrap: 'wrap',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metadataText: {
    fontSize: 12,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
  },
  logButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  synopsisSection: {
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  synopsisText: {
    fontSize: 14,
    lineHeight: 22,
  },
});