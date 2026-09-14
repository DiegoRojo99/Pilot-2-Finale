import { StyleSheet, type ViewProps } from 'react-native';

import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type EmptyStateProps = ViewProps & {
  title: string;
  description: string;
};

export function EmptyState({ title, description, style, ...props }: EmptyStateProps) {
  return (
    <Card style={[styles.emptyState, style]} {...props}>
      <ThemedText type="subtitle">{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
        {description}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    gap: Spacing.two,
  },
  description: {
    lineHeight: 20,
  },
});