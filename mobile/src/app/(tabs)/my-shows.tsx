import { AuthGate } from '@/components/auth/auth-gate';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getMyShows } from '@/lib/shows';
import { getUpcomingEpisodes } from '@/lib/episodes';
import { UserShowCard } from '@/components/show/user-show-card';
import { TabBar } from '@/components/ui/tab-bar';
import type { UserShow } from '@/types/api';
import type { UpcomingEpisode } from '@/types/episode';

type TabType = 'shows' | 'coming';

function AuthenticatedMyShows({ selectedStatus, selectedTab }: { selectedStatus: string; selectedTab: TabType }) {
  const theme = useTheme();
  const [allShows, setAllShows] = useState<UserShow[]>([]);
  const [shows, setShows] = useState<UserShow[]>([]);
  const [upcomingEpisodes, setUpcomingEpisodes] = useState<UpcomingEpisode[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchShows = async () => {
    try {
      const data = await getMyShows();
      setAllShows(data);
      setStatus('success');
    } 
    catch (error) {
      setStatus('error');
    }
  };

  const fetchUpcomingEpisodes = async () => {
    try {
      const data = await getUpcomingEpisodes('watching');
      setUpcomingEpisodes(data.episodes);
    }
    catch (error) {
      console.error('Error fetching upcoming episodes:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (isMounted) {
        await fetchShows();
        await fetchUpcomingEpisodes();
      }
    }

    void load();
    return () => { 
      isMounted = false; 
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchShows();
      await fetchUpcomingEpisodes();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedStatus === '') setShows(allShows);
    else setShows(allShows.filter((show) => show.status === selectedStatus));
  }, [selectedStatus, allShows]);

  if (status === 'loading') {
    return (
      <ScrollView
        scrollEnabled={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.accent} />}
        style={{ flex: 1 }}
      >
        <ThemedView style={styles.list}>
          <Card style={styles.centerCard}>
            <ActivityIndicator color={theme.accent} />
            <ThemedText type="small" themeColor="textSecondary">
              Loading...
            </ThemedText>
          </Card>
        </ThemedView>
      </ScrollView>
    );
  }

  if (status === 'error') {
    return (
      <ScrollView
        scrollEnabled={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.accent} />}
        style={{ flex: 1 }}
      >
        <ThemedView style={styles.list}>
          <Card>
            <ThemedText type="subtitle">Could not load</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Your session may have expired. Try signing out and back in from Profile.
            </ThemedText>
          </Card>
        </ThemedView>
      </ScrollView>
    );
  }

  // My Shows Tab
  if (selectedTab === 'shows') {
    if (shows.length === 0) {
      return (
        <ScrollView
          scrollEnabled={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.accent} />}
          style={{ flex: 1 }}
        >
          <ThemedView style={styles.list}>
            <Card>
              <ThemedText type="subtitle">No shows yet</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Search for a show in Discover and add it to start building your library.
              </ThemedText>
            </Card>
          </ThemedView>
        </ScrollView>
      );
    }

    return (
      <ScrollView
        scrollEnabled={true}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.accent} />}
        style={{ flex: 1 }}
      >
        <ThemedView style={styles.list}>
          {shows.map((show) => (
            <UserShowCard key={show.id} show={show} onEpisodeLogged={handleRefresh} />
          ))}
        </ThemedView>
      </ScrollView>
    );
  }

  // Coming Soon Tab
  if (selectedTab === 'coming') {
    if (upcomingEpisodes.length === 0) {
      return (
        <ScrollView
          scrollEnabled={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.accent} />}
          style={{ flex: 1 }}
        >
          <ThemedView style={styles.list}>
            <Card>
              <ThemedText type="subtitle">No upcoming episodes</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                No new episodes coming soon for your watched shows.
              </ThemedText>
            </Card>
          </ThemedView>
        </ScrollView>
      );
    }

    // Group episodes by air date
    const groupedEpisodes = upcomingEpisodes.reduce(
      (groups, episode) => {
        const dateKey = episode.airDate;
        const existing = groups.find(g => g.date === dateKey);
        if (existing) existing.episodes.push(episode);
        else groups.push({ date: dateKey, episodes: [episode] });
        return groups;
      },
      [] as { date: string; episodes: UpcomingEpisode[] }[]
    );

    return (
      <ScrollView
        scrollEnabled={true}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.accent} />}
        style={{ flex: 1 }}
      >
        <ThemedView style={styles.list}>
          {groupedEpisodes.map((group: { date: string; episodes: UpcomingEpisode[] }) => {
            const groupDate = new Date(group.date);
            const dateLabel = groupDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

            return (
              <View key={group.date}>
                <ThemedText 
                  type="subtitle" 
                  style={[styles.dateLabel, { color: theme.textSecondary }]}
                >
                  {dateLabel}
                </ThemedText>
                {group.episodes.map((episode: UpcomingEpisode) => {
                  const posterUrl = episode.showPosterPath
                    ? `https://image.tmdb.org/t/p/w185${episode.showPosterPath}`
                    : null;

                  return (
                    <Card 
                      key={`${episode.showId}-${episode.seasonNumber}-${episode.episodeNumber}`}
                      style={styles.episodeCard}
                    >
                      <View style={styles.episodeContent}>
                        {posterUrl ? (
                          <Image
                            source={{ uri: posterUrl }}
                            style={styles.episodePoster}
                          />
                        ) : (
                          <View style={[styles.episodePoster, { backgroundColor: theme.backgroundElement }]} />
                        )}
                        <View style={styles.episodeInfo}>
                          <ThemedText type="small" style={{ fontWeight: '600' }} numberOfLines={1}>
                            {episode.showName}
                          </ThemedText>
                          <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one, fontSize: 12 }} numberOfLines={1}>
                            S{String(episode.seasonNumber).padStart(2, '0')} E{String(episode.episodeNumber).padStart(2, '0')}
                          </ThemedText>
                          {episode.title && (
                            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }} numberOfLines={2}>
                              {episode.title}
                            </ThemedText>
                          )}
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </View>
            );
          })}
        </ThemedView>
      </ScrollView>
    );
  }
}

export default function MyShowsScreen() {
  const theme = useTheme();
  const [selectedStatus, setSelectedStatus] = useState<string>('watching');
  const [selectedTab, setSelectedTab] = useState<TabType>('shows');

  return (
    <View style={[styles.scrollView, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Tabs - Full Width */}
        <TabBar
          tabs={[
            {
              id: 'shows',
              label: 'My Shows',
              symbolIcon: { ios: 'tv', android: 'tv', web: 'tv' },
            },
            {
              id: 'coming',
              label: 'Coming Soon',
              symbolIcon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
            },
          ]}
          activeTab={selectedTab}
          onTabChange={(tabId) => setSelectedTab(tabId as TabType)}
          useSymbols={true}
        />

        {/* Status filter - only for My Shows tab */}
        {selectedTab === 'shows' && (
          <ThemedView style={styles.filterContainer}>
            <WatchedStatusDropdown selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} />
          </ThemedView>
        )}

        <AuthGate title="Sign in to view your shows" description="Your watchlist is saved to your account so it can follow you across devices.">
          <AuthenticatedMyShows selectedStatus={selectedStatus} selectedTab={selectedTab} />
        </AuthGate>
      </SafeAreaView>
    </View>
  );
}

function WatchedStatusDropdown({ selectedStatus, setSelectedStatus }: { selectedStatus: string; setSelectedStatus: (status: string) => void }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const theme = useTheme();

  const statusOptions = [
    { label: 'All', value: '' },
    { label: 'Watching', value: 'watching' },
    { label: 'Watchlist', value: 'want_to_watch' },
    { label: 'Completed', value: 'watched' },
    { label: 'On Hold', value: 'on_hold' },
    { label: 'Dropped', value: 'dropped' },
  ];

  const selectedLabel = statusOptions.find((opt) => opt.value === selectedStatus)?.label || 'Filter';

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        onPress={() => setShowDropdown(!showDropdown)}
        style={[styles.filterButton, { borderColor: theme.border, backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="small">{selectedLabel}</ThemedText>
      </TouchableOpacity>
      {showDropdown && (
        <View style={[styles.dropdownMenu, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                setSelectedStatus(option.value);
                setShowDropdown(false);
              }}
              style={[
                styles.dropdownItem,
                selectedStatus === option.value && {
                  backgroundColor: theme.accent,
                },
              ]}>
              <ThemedText
                type="small"
                style={{
                  color: selectedStatus === option.value ? theme.accentText : theme.text,
                }}>
                {option.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  filterContainer: {
    marginBottom: Spacing.three,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  filterButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 54,
    right: 0,
    width: '100%',
    minWidth: 150,
    marginTop: 0,
    borderRadius: Spacing.two,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 1001,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  centerCard: {
    alignItems: 'center',
  },
  dateLabel: {
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
    fontWeight: '700',
  },
  episodeCard: {
    marginBottom: Spacing.two,
    padding: 0,
    overflow: 'hidden',
    borderRadius: Spacing.two,
  },
  episodeContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  episodePoster: {
    width: 56,
    height: 85,
    marginRight: Spacing.two,
  },
  episodeInfo: {
    flex: 1,
    padding: Spacing.two,
    justifyContent: 'center',
  },
  list: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
});