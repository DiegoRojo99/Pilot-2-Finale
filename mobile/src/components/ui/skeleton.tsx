import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedView } from '@/components/themed-view';

type SkeletonProps = {
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ style }: SkeletonProps) {
  return <ThemedView type="backgroundSelected" style={[styles.skeleton, style]} />;
}

const styles = StyleSheet.create({
  skeleton: {
    opacity: 0.65,
  },
});