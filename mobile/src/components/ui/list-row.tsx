import { StyleSheet, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type ListRowProps = ViewProps & {
  title: string;
  subtitle?: string;
};

export function ListRow({ title, subtitle, children, style, ...props }: ListRowProps) {
  return (
    <ThemedView type="backgroundSelected" style={[styles.row, style]} {...props}>
      <ThemedView type="backgroundSelected" style={styles.text}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </ThemedView>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
});