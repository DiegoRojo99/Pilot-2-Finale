import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ShowCardSkeleton() {
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
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.surfaceBackground,
          opacity,
        },
        Shadows.sm,
      ]}
    >
      {/* Poster skeleton */}
      <View style={styles.poster} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    aspectRatio: 2 / 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});
