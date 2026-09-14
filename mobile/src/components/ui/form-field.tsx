import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FormFieldProps = TextInputProps & {
  label: string;
};

export function FormField({ label, style, ...props }: FormFieldProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { borderColor: theme.border, color: theme.text }, style]}
        {...props}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
});