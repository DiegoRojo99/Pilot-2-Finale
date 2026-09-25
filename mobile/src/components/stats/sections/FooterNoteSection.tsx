import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function FooterNoteSection() {
  return (
    <View style={[styles.section, { marginBottom: Spacing['2xl'] }]}>
      <ThemedView type="backgroundSelected" style={styles.note}>
        <ThemedText type="small" themeColor="textSecondary">
          More insights coming soon! Keep tracking your viewing journey.
        </ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  note: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
});
