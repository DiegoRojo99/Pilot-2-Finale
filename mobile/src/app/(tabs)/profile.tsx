import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/components/auth/auth-provider';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getAchievements, isUnlocked, type AchievementProgress } from '@/lib/achievements';
import { getStats } from '@/lib/episodes';
import type { EpisodeStatsResponse } from '@/types/episode';

export default function ProfileScreen() {
  const auth = useAuth();
  const theme = useTheme();
  const [stats, setStats] = useState<EpisodeStatsResponse | null>(null);
  const [achievements, setAchievements] = useState<AchievementProgress[] | null>(null);
  const isAuthenticated = auth.status === 'authenticated';

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;
      getStats('l30d').then(setStats).catch(() => {});
      getAchievements().then(setAchievements).catch(() => {});
    }, [isAuthenticated]),
  );

  if (auth.status === 'loading') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  if (auth.status === 'unauthenticated') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ThemedText>Sign in to view your profile.</ThemedText>
      </SafeAreaView>
    );
  }

  const displayName = auth.user?.name?.trim() || auth.user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  const unlocked = achievements?.filter(isUnlocked).length ?? 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
            <ThemedText type="subtitle" style={{ color: theme.accentText }}>
              {initials || '?'}
            </ThemedText>
          </View>
          <ThemedText type="subtitle">{displayName}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {auth.user?.email ?? auth.user?.id}
          </ThemedText>
        </View>

        <SettingSection title="ACCOUNT">
          <SettingItem icon="👤" title="Personal Information" value={undefined} onPress={() => {}} />
          <SettingItem icon="🔔" title="Achievements" value={`${unlocked}/${achievements?.length ?? 0}`} onPress={() => router.push('/achievements')} />
        </SettingSection>

        <SettingSection title="PREFERENCES">
          <SettingItem icon="🎨" title="Theme" value="System" onPress={() => {}} />
          <SettingItem icon="🔒" title="Privacy & Data" value={undefined} onPress={() => {}} />
        </SettingSection>

        <SettingSection title="APP">
          <SettingItem icon="⭐" title="Rate Pilot 2 Finale" value={undefined} onPress={() => {}} />
          <SettingItem icon="👋" title="Sign Out" value={undefined} onPress={() => void auth.signOut()} danger />
        </SettingSection>

        <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
          Pilot 2 Finale • Version {Constants.expoConfig?.version ?? '—'}
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingSection({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      <Card style={[styles.settingCard, { borderColor: theme.border }]}>
        {children}
      </Card>
    </View>
  );
}

function SettingItem({
  icon,
  title,
  value,
  onPress,
  danger = false,
}: {
  icon: string;
  title: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingItem, { borderBottomColor: theme.border }]}
      accessibilityRole="button"
      accessibilityLabel={`${title}${value ? `, ${value}` : ''}`}>
      <ThemedText type="subtitle" style={{ fontSize: 20 }}>
        {icon}
      </ThemedText>
      <ThemedText type="smallBold" style={{ flex: 1, color: danger ? theme.danger : theme.text }}>
        {title}
      </ThemedText>
      {value && (
        <ThemedText type="small" themeColor={danger ? undefined : 'textSecondary'} style={{ color: danger ? theme.danger : undefined }}>
          {value}
        </ThemedText>
      )}
      <ThemedText type="small" themeColor="textSecondary" style={{ marginLeft: Spacing.sm }}>
        ›
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.sm,
    fontSize: 12,
    fontWeight: '600',
  },
  settingCard: {
    borderWidth: 1,
    borderRadius: Spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
    borderBottomWidth: 1,
  },
  footer: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});