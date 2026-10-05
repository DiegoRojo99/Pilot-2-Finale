import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { ComponentProps, ReactNode } from 'react';
import { useState } from 'react';
import { ShowCard } from './show-card';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, BorderRadius } from '@/constants/theme';
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
  const [currentPage, setCurrentPage] = useState(0);
  
  const CARD_WIDTH = 176;
  const VISIBLE_CARDS = 2.5;
  const TOTAL_PAGES = Math.ceil((shows.length - VISIBLE_CARDS) / 2) || 1;

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / (CARD_WIDTH + 12)); // 12 is gap
    setCurrentPage(Math.min(page, TOTAL_PAGES - 1));
  };

  return (
    <ThemedView style={styles.section}>
      <ThemedView style={styles.heading}>
        <SymbolView name={icon} size={18} tintColor={theme.accent} />
        <ThemedText type="subtitle">{title}</ThemedText>
      </ThemedView>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        {shows.slice(0, 15).map((show) => (
          <ShowCard key={show.id} show={show} onShowPress={onShowPress} />
        ))}
      </ScrollView>
      
      {TOTAL_PAGES > 1 && (
        <View style={styles.indicatorsContainer}>
          {Array.from({ length: TOTAL_PAGES }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor: index === currentPage ? theme.accent : theme.surfaceBackground,
                  borderColor: index === currentPage ? theme.accent : theme.border,
                },
              ]}
            />
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingRight: Spacing.lg,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
  },
});