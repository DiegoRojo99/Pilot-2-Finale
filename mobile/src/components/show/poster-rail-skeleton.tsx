import { StyleSheet, View } from 'react-native';
import { ShowCardSkeleton } from './show-card-skeleton';
import { Spacing } from '@/constants/theme';

type PosterRailSkeletonProps = {
  count?: number;
};

export function PosterRailSkeleton({ count = 5 }: PosterRailSkeletonProps) {
  return (
    <View style={styles.section}>
      {/* Title skeleton */}
      <View style={styles.titleBar} />

      {/* Cards skeleton row */}
      <View style={styles.cardsRow}>
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={styles.cardWrapper}>
            <ShowCardSkeleton />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  titleBar: {
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
    width: '40%',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cardWrapper: {
    marginRight: Spacing.md,
  },
});
