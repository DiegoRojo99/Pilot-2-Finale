import { AuthGate } from '@/components/auth/auth-gate';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getMyShows } from '@/lib/shows';
import { UserShowCard } from '@/components/show/user-show-card';
import type { UserShow } from '@/types/api';

function AuthenticatedMyShows({ selectedStatus }: { selectedStatus: string }) {
  const theme = useTheme();
  const [allShows, setAllShows] = useState<UserShow[]>([]);
  const [shows, setShows] = useState<UserShow[]>([]);
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

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (isMounted) await fetchShows();
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
              Loading your shows...
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
            <ThemedText type="subtitle">Could not load shows</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Your session may have expired. Try signing out and back in from Profile.
            </ThemedText>
          </Card>
        </ThemedView>
      </ScrollView>
    );
  }

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
          <UserShowCard key={show.id} show={show} />
        ))}
      </ThemedView>
    </ScrollView>
  );
}

export default function MyShowsScreen() {
  const theme = useTheme();
  const [selectedStatus, setSelectedStatus] = useState<string>('watching');

  return (
    <View style={[styles.scrollView, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ThemedView style={styles.titleArea}>
          <ThemedText type="title" themeColor="text">
            My Shows
          </ThemedText>
          <WatchedStatusDropdown selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} />
        </ThemedView>
        <AuthGate title="Sign in to view your shows" description="Your watchlist is saved to your account so it can follow you across devices.">
          <AuthenticatedMyShows selectedStatus={selectedStatus} />
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
    padding: Spacing.two,
  },
  titleArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  filterButton: {
    marginTop: Spacing.two,
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
  list: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
});