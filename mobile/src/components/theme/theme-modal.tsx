import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference } from '@/components/theme/theme-provider';
import type { ThemePreference } from '@/lib/theme-storage';

type ThemeModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function ThemeModal({ visible, onClose }: ThemeModalProps) {
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();

  const options: { value: ThemePreference; label: string; description: string }[] = [
    { value: 'light', label: 'Light', description: 'Always use light theme' },
    { value: 'dark', label: 'Dark', description: 'Always use dark theme' },
    { value: 'system', label: 'System', description: 'Follow system settings' },
  ];

  async function handleSelect(value: ThemePreference) {
    await setPreference(value);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
            <ThemedText type="smallBold">✕ Close</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">Theme</ThemedText>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => void handleSelect(option.value)}
              style={[
                styles.option,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: preference === option.value ? theme.accent : theme.border,
                  borderWidth: preference === option.value ? 2 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: preference === option.value }}>
              <View style={styles.optionContent}>
                <ThemedText type="smallBold">{option.label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {option.description}
                </ThemedText>
              </View>
              {preference === option.value && <Ionicons name="checkmark-circle" size={24} color={theme.accent} />}
            </Pressable>
          ))}
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Spacing.lg,
    gap: Spacing.md,
  },
  optionContent: {
    flex: 1,
    gap: Spacing.sm,
  },
});
