import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, LayoutAnimation, Linking, Pressable, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';

import { useAuth } from '@/components/auth/auth-provider';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { createApiUrl } from '@/lib/api';
import { getAchievements, isUnlocked, type AchievementProgress } from '@/lib/achievements';
import { getStats } from '@/lib/episodes';
import type { EpisodeStatsResponse } from '@/types/episode';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AuthScreen } from '@/components/auth/auth-screen';
import { DeleteAccountCard } from '@/components/auth/delete-account-card';

export default function ProfileScreen() {
  const auth = useAuth();
  const theme = useTheme();
  const [showDeleteCard, setShowDeleteCard] = useState(false);
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
      <Screen>
        <Card style={styles.centerCard}>
          <ActivityIndicator color={theme.accent} />
          <ThemedText type="small" themeColor="textSecondary">
            Checking your session...
          </ThemedText>
        </Card>
      </Screen>
    );
  }

  if (auth.status === 'unauthenticated') return <AuthScreen />;

  const displayName = auth.user?.name?.trim() || auth.user?.email?.split('@')[0] || 'Your profile';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  const unlocked = achievements?.filter(isUnlocked).length ?? 0;

  return (
    <Screen>
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

      <Card>
        <View style={styles.statsRow}>
          <Stat label="Shows" value={stats?.totalShows} />
          <Stat label="Episodes" value={stats?.totalEpisodes} />
          <Stat label="Completed" value={stats?.watchedShows} />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/achievements')}
          style={[styles.achievementsRow, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">🏆 Achievements</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {achievements ? `${unlocked}/${achievements.length} unlocked ›` : '›'}
          </ThemedText>
        </Pressable>
      </Card>

      <Section title="Help">
        {FAQ.map((item) => (
          <FaqItem key={item.question} question={item.question} answer={item.answer} />
        ))}
      </Section>

      <Section title="Data & Privacy">
        <Button label="Privacy Policy" variant="secondary" onPress={() => void Linking.openURL(createApiUrl('/privacy'))} />
        {!showDeleteCard && (
          <Button label="Request Account Deletion" variant="danger" onPress={() => setShowDeleteCard(true)} />
        )}
        {showDeleteCard && <DeleteAccountCard onClose={() => setShowDeleteCard(false)} />}
      </Section>

      <Section title="About">
        <ThemedText type="small" themeColor="textSecondary">
          Pilot 2 Finale v{Constants.expoConfig?.version ?? '—'}
        </ThemedText>
      </Section>

      <Button label="Sign out" variant="secondary" onPress={() => void auth.signOut()} />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <View style={styles.stat}>
      <ThemedText type="subtitle">{value ?? '–'}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title.toUpperCase()}
      </ThemedText>
      {children}
    </View>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpen((value) => !value);
      }}
      style={[styles.faq, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <ThemedText type="smallBold">
        {open ? '▾' : '▸'} {question}
      </ThemedText>
      {open && (
        <ThemedText type="small" themeColor="textSecondary">
          {answer}
        </ThemedText>
      )}
    </Pressable>
  );
}

const FAQ = [
  {
    question: 'How do I track an episode?',
    answer: 'Open a show, pick a season and log an episode as watched. It will appear in your diary and stats.',
  },
  {
    question: 'How are achievements unlocked?',
    answer: 'Achievements progress automatically as you log episodes, complete shows and rate episodes.',
  },
  {
    question: 'Where does show data come from?',
    answer: 'Show and episode information is provided by TMDB.',
  },
];

const styles = StyleSheet.create({
  centerCard: {
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  achievementsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Spacing.md,
  },
  section: {
    gap: Spacing.sm,
  },
  faq: {
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Spacing.lg,
    borderWidth: 1,
  },
});