import { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getAllEpisodeLogs } from '@/lib/episodes';
import { computeYearDashboard, type YearDashboardStats } from '@/lib/stats';
import { YearDashboardSkeleton } from './YearDashboardSkeleton';

function StatCell({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.cell, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="xxs" themeColor="textSecondary" style={styles.cellLabel}>
        {label}
      </ThemedText>
      <ThemedText type="title" style={{ fontWeight: '700', color: theme.accent }}>
        {value}
      </ThemedText>
      {detail ? (
        <ThemedText type="xs" themeColor="textSecondary">
          {detail}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function YearDashboardSection() {
  const theme = useTheme();
  const [stats, setStats] = useState<YearDashboardStats | null>(null);
  const [failed, setFailed] = useState(false);
  const [showDetail, setShowDetail] = useState<'streak' | 'hero' | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllEpisodeLogs(10000)
        .then((logs) => {
          if (!active) return;
          setStats(computeYearDashboard(logs));
          setFailed(false);
        })
        .catch(() => {
          if (active) setFailed(true);
        });
      return () => {
        active = false;
      };
    }, [])
  );

  if (failed && !stats) return null;

  if (!stats) {
    return <YearDashboardSkeleton />;
  }

  return (
    <>
      <View style={styles.section}>
        <ThemedText type="small" style={styles.sectionTitle}>
          {stats.year} SUMMARY
        </ThemedText>

        {/* Hero stat */}
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowDetail('hero')}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <View style={[styles.heroCell, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="xxs" themeColor="textSecondary" style={styles.cellLabel}>
              EPISODES WATCHED
            </ThemedText>
            <ThemedText type="title" style={{ fontWeight: '800', color: theme.accent, fontSize: 48 }}>
              {stats.episodesThisYear}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {stats.episodesThisYear === 1 ? 'episode' : 'episodes'} across {stats.daysWatched}{' '}
              {stats.daysWatched === 1 ? 'day' : 'days'}
            </ThemedText>
          </View>
        </Pressable>

        {/* Secondary stats row */}
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowDetail('streak')}
            style={({ pressed: isPressedValue }) => [
              styles.wrapper,
              { flex: 1 },
              isPressedValue && styles.pressed,
            ]}
          >
            <StatCell
              label="DAY STREAK"
              value={stats.currentStreak}
              detail={stats.currentStreak < stats.longestStreak ? `longest: ${stats.longestStreak}` : `ACTIVE`}
            />
          </Pressable>
          <StatCell label="DAYS LOGGED" value={stats.daysWatched} />
        </View>
      </View>

      {/* Detail modal for streak */}
      <Modal
        visible={showDetail === 'streak'}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetail(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setShowDetail(null)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[styles.modal, { backgroundColor: theme.backgroundElement }]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="small" style={{ fontWeight: '800', letterSpacing: 1 }}>
                YOUR STREAK
              </ThemedText>
              <Pressable onPress={() => setShowDetail(null)} hitSlop={8}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>
            <View style={styles.modalContent}>
              <View style={styles.streakDetail}>
                <ThemedText type="default">Current streak</ThemedText>
                <ThemedText type="title" style={{ color: theme.accent, fontWeight: '800' }}>
                  {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'} 🔥
                </ThemedText>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.streakDetail}>
                <ThemedText type="default">Longest this year</ThemedText>
                <ThemedText type="default" style={{ color: theme.accent, fontWeight: '700' }}>
                  {stats.longestStreak} {stats.longestStreak === 1 ? 'day' : 'days'}
                </ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.streakNote}>
                Keep watching to maintain your streak!
              </ThemedText>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Detail modal for hero */}
      <Modal
        visible={showDetail === 'hero'}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetail(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setShowDetail(null)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[styles.modal, { backgroundColor: theme.backgroundElement }]}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="small" style={{ fontWeight: '800', letterSpacing: 1 }}>
                {stats.year} SUMMARY
              </ThemedText>
              <Pressable onPress={() => setShowDetail(null)} hitSlop={8}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>
            <View style={styles.modalContent}>
              <View style={styles.summaryDetail}>
                <ThemedText type="small" themeColor="textSecondary">
                  Episodes watched
                </ThemedText>
                <ThemedText type="title" style={{ color: theme.accent, fontWeight: '800' }}>
                  {stats.episodesThisYear}
                </ThemedText>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.summaryDetail}>
                <ThemedText type="small" themeColor="textSecondary">
                  Active days
                </ThemedText>
                <ThemedText type="title" style={{ color: theme.accent, fontWeight: '800' }}>
                  {stats.daysWatched}
                </ThemedText>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.summaryDetail}>
                <ThemedText type="small" themeColor="textSecondary">
                  Per active day
                </ThemedText>
                <ThemedText type="title" style={{ color: theme.accent, fontWeight: '800' }}>
                  {stats.daysWatched > 0 ? (stats.episodesThisYear / stats.daysWatched).toFixed(1) : '—'}
                </ThemedText>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  wrapper: {},
  pressed: {
    opacity: 0.7,
  },
  heroCell: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  cell: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cellLabel: {
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  modal: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  modalContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  divider: {
    height: 1,
  },
  streakDetail: {
    gap: Spacing.sm,
  },
  streakNote: {
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  summaryDetail: {
    gap: Spacing.xs,
  },
});
