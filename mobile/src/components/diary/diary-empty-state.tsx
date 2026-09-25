import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

interface DiaryEmptyStateProps {
  title?: string;
  description?: string;
}

export function DiaryEmptyState({
  title = 'No watch history yet',
  description = 'Start watching episodes and logging them to build your diary.',
}: DiaryEmptyStateProps) {
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
