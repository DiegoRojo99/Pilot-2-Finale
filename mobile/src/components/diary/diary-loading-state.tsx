import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface DiaryLoadingStateProps {
  label?: string;
}

export function DiaryLoadingState({ label = 'Loading history...' }: DiaryLoadingStateProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing['2xl'],
      }}
    >
      <ActivityIndicator color={theme.accent} size="large" />
      <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.lg }}>
        {label}
      </ThemedText>
    </View>
  );
}
