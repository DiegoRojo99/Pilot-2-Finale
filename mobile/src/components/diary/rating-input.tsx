import React from 'react';
import { TextInput, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface RatingInputProps {
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
}

export function RatingInput({ value, onChangeText, disabled = false }: RatingInputProps) {
  const theme = useTheme();

  return (
    <Card style={{ marginBottom: Spacing.md }}>
      <ThemedText type="subtitle" style={{ marginBottom: Spacing.sm }}>
        Rating (0-10)
      </ThemedText>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 8,
          padding: Spacing.md,
          color: theme.text,
          fontSize: 16,
        }}
        placeholder="Leave empty for no rating"
        placeholderTextColor={theme.textSecondary}
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
      />
    </Card>
  );
}
