import { StyleSheet, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type BadgeProps = ViewProps & {
  label: string;
};

export function Badge({ label, style, ...props }: BadgeProps) {
  return (
    <ThemedView type="backgroundSelected" style={[styles.badge, style]} {...props}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
});