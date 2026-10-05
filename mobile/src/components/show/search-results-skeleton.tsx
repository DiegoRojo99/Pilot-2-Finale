import { StyleSheet, View } from 'react-native';
import { ShowCardSkeleton } from './show-card-skeleton';
import { Spacing } from '@/constants/theme';

type SearchResultsSkeletonProps = {
  count?: number;
};

export function SearchResultsSkeleton({ count = 6 }: SearchResultsSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.gridItem}>
          <ShowCardSkeleton />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  gridItem: {
    width: '48%',
  },
});
