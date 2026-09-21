import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

interface StatsErrorStateProps {
  title?: string;
  description?: string;
}

export function StatsErrorState({
  title = 'Could not load history',
  description = 'There was an error fetching your watch history.',
}: StatsErrorStateProps) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing['2xl'],
      }}
    >
      <ThemedText type="subtitle">{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.sm, textAlign: 'center' }}>
        {description}
      </ThemedText>
    </View>
  );
}
