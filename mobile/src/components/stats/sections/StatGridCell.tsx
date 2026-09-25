import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export function StatGridCell({ labelTop, labelBottom, value }: { labelTop: string; labelBottom: string; value: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.statGridCell, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '800' }}>{labelTop}</ThemedText>
      <ThemedText type="title" style={{ fontWeight: '700', color: theme.accent }}>
        {value}
      </ThemedText>
      <ThemedText type="xs" style={{ color: theme.textSecondary }}>{labelBottom}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  statGridCell: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '48%',
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
});
