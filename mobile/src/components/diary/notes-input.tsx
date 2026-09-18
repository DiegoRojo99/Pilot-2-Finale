import React from 'react';
import { TextInput, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface NotesInputProps {
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
}

export function NotesInput({ value, onChangeText, disabled = false }: NotesInputProps) {
  const theme = useTheme();

  return (
    <Card style={{ marginBottom: Spacing.lg }}>
      <ThemedText type="subtitle" style={{ marginBottom: Spacing.sm }}>
        Notes
      </ThemedText>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 8,
          padding: Spacing.md,
          color: theme.text,
          fontSize: 14,
          minHeight: 100,
          textAlignVertical: 'top',
        }}
        placeholder="Add your thoughts about this episode..."
        placeholderTextColor={theme.textSecondary}
        multiline
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
      />
    </Card>
  );
}
