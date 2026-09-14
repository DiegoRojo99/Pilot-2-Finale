import { ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { PropsWithChildren } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AuthGateProps = PropsWithChildren & {
  title: string;
  description: string;
};

export function AuthGate({ title, description, children }: AuthGateProps) {
  const auth = useAuth();
  const router = useRouter();
  const theme = useTheme();

  if (auth.status === 'loading') {
    return (
      <Card style={styles.card}>
        <ActivityIndicator color={theme.accent} />
        <ThemedText type="small" themeColor="textSecondary">
          Checking your session...
        </ThemedText>
      </Card>
    );
  }

  if (auth.status === 'unauthenticated') {
    return (
      <Card style={styles.card}>
        <ThemedText type="subtitle">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
          {description}
        </ThemedText>
        <Button label="Go to Profile" onPress={() => router.push('/profile')} />
      </Card>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    gap: Spacing.three,
  },
  description: {
    lineHeight: 20,
  },
});