import { ScrollView, StyleSheet, View } from 'react-native';
import { ShowCardSkeleton } from './show-card-skeleton';
import { Spacing } from '@/constants/theme';

type PosterRailSkeletonProps = {
  count?: number;
};

export function PosterRailSkeleton({ count = 5 }: PosterRailSkeletonProps) {
  return (
    <View style={styles.section}>
      {/* Section header skeleton: title + "See All" */}
      <View style={styles.header}>
        <View style={[styles.bar, styles.titleBar]} />
        <View style={[styles.bar, styles.seeAllBar]} />
      </View>

      {/* Cards skeleton row */}
      <ScrollView
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.cardsRow}
      >
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={styles.cardWrapper}>
            <ShowCardSkeleton />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    height: 24,
  },
  bar: {
    height: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.25)',
    borderRadius: 6,
  },
  titleBar: {
    width: 120,
  },
  seeAllBar: {
    width: 64,
  },
  cardsRow: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  cardWrapper: {
    width: 120,
    marginRight: Spacing.md,
  },
});
