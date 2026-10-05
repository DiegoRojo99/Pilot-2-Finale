import { useState } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getBackdropUrl, getPosterUrl, getYear } from '@/lib/tmdb-images';
import { STATUS_LABELS, type ShowStatus, type TMDBShow, type UserShow } from '@/types/api';

interface ShowDetailHeroProps {
  show: TMDBShow;
  userShow: UserShow | null;
  onStatusChange: (status: ShowStatus) => Promise<void>;
  onRemoveShow?: () => Promise<void>;
  isUpdating: boolean;
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

export function ShowDetailHero({
  show,
  userShow,
  onStatusChange,
  onRemoveShow,
  isUpdating,
}: ShowDetailHeroProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const theme = useTheme();
  
  const posterUrl = getPosterUrl(show.poster_path ?? null);
  const backdropUrl = getBackdropUrl(show.backdrop_path ?? null);

  const handleStatusChange = async (newStatus: ShowStatus) => {
    setShowStatusMenu(false);
    await onStatusChange(newStatus);
  };

  const handleRemoveShow = async () => {
    if (onRemoveShow) {
      setShowStatusMenu(false);
      await onRemoveShow();
    }
  };

  return (
    <>
      {backdropUrl ? (
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
          disabled={isUpdating}
          style={[
            styles.statusButton,
            {
              backgroundColor: theme.backgroundSelected,
              borderColor: theme.border,
              opacity: isUpdating ? 0.6 : 1,
            }
          ]}
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
                disabled={isUpdating}
                style={[
                  styles.statusMenuItem,
                  userShow?.status === s && { backgroundColor: theme.accent },
                  isUpdating && { opacity: 0.5 }
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
            {userShow && onRemoveShow && (
              <>
                <View style={[styles.statusMenuDivider, { borderColor: theme.border }]} />
                <TouchableOpacity
                  onPress={handleRemoveShow}
                  disabled={isUpdating}
                  style={[styles.statusMenuItem, isUpdating && { opacity: 0.5 }]}
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
    </>
  );
}

const styles = StyleSheet.create({
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
});
