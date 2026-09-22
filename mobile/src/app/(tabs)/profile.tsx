import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/components/auth/auth-provider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
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

  return (
    <Screen>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Profile</ThemedText>
      </ThemedView>

      <View>
        <ThemedText type="small" themeColor="textSecondary">
          Signed in as
        </ThemedText>
        <ThemedText type="smallBold">{auth.user?.email ?? auth.user?.id ?? 'Current user'}</ThemedText>
      </View>

      <Button label="Sign out" variant="secondary" onPress={() => void auth.signOut()} />
      {!showDeleteCard && (
        <Button label="Request Account Deletion" variant="danger" onPress={() => setShowDeleteCard(true)} />
      )}

      {showDeleteCard && <DeleteAccountCard onClose={() => setShowDeleteCard(false)} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.two,
  },
  centerCard: {
    alignItems: 'center',
  },
});