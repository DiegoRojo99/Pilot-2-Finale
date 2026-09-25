import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export function StatRow({ label, value }: { label: string; value: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.statRow, { borderColor: theme.border }]}>
      <ThemedText type="small">{label}</ThemedText>
      <ThemedText type="subtitle" style={{ fontWeight: '700' }}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.two,
  },
});
