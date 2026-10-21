import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function YearDashboardSkeleton() {
  const theme = useTheme();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.7],
  });

  return (
    <View style={styles.section}>
      {/* Hero skeleton */}
      <Animated.View
        style={[
          styles.heroSkeleton,
          { backgroundColor: theme.backgroundElement, opacity },
        ]}
      >
        <View style={[styles.bar, styles.barSmall]} />
        <View style={[styles.bar, styles.barLarge, { marginVertical: Spacing.sm }]} />
        <View style={[styles.bar, styles.barMedium]} />
      </Animated.View>

      {/* Secondary stats row */}
      <View style={styles.row}>
        <Animated.View
          style={[
            styles.secondarySkeleton,
            { backgroundColor: theme.backgroundElement, opacity },
          ]}
        >
          <View style={[styles.bar, styles.barSmall]} />
          <View style={[styles.bar, styles.barMedium, { marginVertical: Spacing.sm }]} />
          <View style={[styles.bar, styles.barSmall]} />
        </Animated.View>
        <Animated.View
          style={[
            styles.secondarySkeleton,
            { backgroundColor: theme.backgroundElement, opacity },
          ]}
        >
          <View style={[styles.bar, styles.barSmall]} />
          <View style={[styles.bar, styles.barMedium, { marginVertical: Spacing.sm }]} />
          <View style={[styles.bar, styles.barSmall]} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  heroSkeleton: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  secondarySkeleton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    justifyContent: 'center',
    minHeight: 120,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  bar: {
    height: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.25)',
    borderRadius: 4,
  },
  barSmall: {
    width: '40%',
  },
  barMedium: {
    width: '60%',
  },
  barLarge: {
    width: '80%',
    height: 36,
  },
});
