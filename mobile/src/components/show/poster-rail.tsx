import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet } from 'react-native';
import type { ComponentProps } from 'react';
import { ShowCard } from './show-card';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TMDBShow } from '@/types/api';

type PosterRailProps = {
  title: string;
  icon: ComponentProps<typeof SymbolView>['name'];
  shows: TMDBShow[];
  onShowPress?: (show: TMDBShow) => void;
};

export function PosterRail({ title, icon, shows, onShowPress }: PosterRailProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.section}>
      <ThemedView style={styles.heading}>
        <SymbolView name={icon} size={18} tintColor={theme.accent} />
        <ThemedText type="subtitle">{title}</ThemedText>
      </ThemedView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
        {shows.slice(0, 15).map((show) => (
          <ShowCard key={show.id} show={show} onShowPress={onShowPress} />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  content: {
    gap: Spacing.three,
    paddingRight: Spacing.four,
  },
});