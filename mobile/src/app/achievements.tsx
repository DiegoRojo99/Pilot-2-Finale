import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getAchievements, isUnlocked, type AchievementProgress } from '@/lib/achievements';

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
}

function progressLabel(item: AchievementProgress) {
  const target = item.next_tier?.required_count;
  return target ? `${item.current_count}/${target}` : `${item.current_count}`;
}

export default function AchievementsScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<AchievementProgress[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAchievements()
        .then((data) => {
          if (!active) return;
          setItems(data);
          setStatus('success');
        })
        .catch(() => active && setStatus('error'));
      return () => {
        active = false;
      };
    }, []),
  );

  if (status === 'loading') {
    return (
      <Screen>
        <ActivityIndicator color={theme.accent} />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen>
        <ThemedText themeColor="textSecondary">Could not load achievements. Pull back and try again.</ThemedText>
      </Screen>
    );
  }

  const unlockedCount = items.filter(isUnlocked).length;
  const selected = items.find((item) => item.achievement_id === selectedId) ?? null;

  async function share(item: AchievementProgress) {
    const tier = item.current_tier?.name ? ` (${item.current_tier.name})` : '';
    await Share.share({ message: `I unlocked "${item.achievement.title}"${tier} on Pilot 2 Finale!` });
  }

  return (
    <Screen>
      <ThemedText type="subtitle">
        {unlockedCount}/{items.length} unlocked
      </ThemedText>

      <View style={styles.grid}>
        {items.map((item) => {
          const unlocked = isUnlocked(item);
          const isSelected = item.achievement_id === selectedId;
          return (
            <Pressable
              key={item.achievement_id}
              accessibilityRole="button"
              accessibilityLabel={`${item.achievement.title}, ${unlocked ? 'unlocked' : 'locked'}`}
              onPress={() => setSelectedId(isSelected ? null : item.achievement_id)}
              style={[
                styles.tile,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: isSelected || unlocked ? theme.accent : theme.border,
                  opacity: unlocked ? 1 : 0.7,
                },
              ]}>
              <ThemedText type="smallBold" numberOfLines={2}>
                {unlocked ? '🏆 ' : '🔒 '}
                {item.achievement.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.current_tier?.name ?? 'Locked'} · {progressLabel(item)}
              </ThemedText>
              <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
                <View
                  style={[
                    styles.fill,
                    { backgroundColor: theme.accent, width: `${Math.min(100, Math.max(0, item.progress_percent))}%` },
                  ]}
                />
              </View>
            </Pressable>
          );
        })}
      </View>

      {selected && (
        <Card>
          <ThemedText type="subtitle">{selected.achievement.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {selected.achievement.description}
          </ThemedText>
          <ThemedText type="small">
            {isUnlocked(selected)
              ? `Unlocked${formatDate(selected.unlocked_at) ? ` on ${formatDate(selected.unlocked_at)}` : ''}`
              : `Progress: ${progressLabel(selected)}`}
          </ThemedText>
          {selected.next_tier && (
            <ThemedText type="small" themeColor="textSecondary">
              Next: {selected.next_tier.name} at {selected.next_tier.required_count}
            </ThemedText>
          )}
          {isUnlocked(selected) && <Button label="Share" variant="secondary" onPress={() => void share(selected)} />}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Spacing.lg,
    borderWidth: 1,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
  },
});
