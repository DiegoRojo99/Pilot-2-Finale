import { useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { AuthForm } from '@/components/auth/auth-form';
import { useAuth } from '@/components/auth/auth-provider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { FormField } from '@/components/ui/form-field';
import { Screen } from '@/components/ui/screen';
import { requestAccountDeletion } from '@/lib/auth';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const auth = useAuth();
  const theme = useTheme();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [confirmation, setConfirmation] = useState('');
  const [isConfirmingDeletion, setIsConfirmingDeletion] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    if (confirmation.trim().toUpperCase() !== 'DELETE') return;

    setIsDeleting(true);
    setError(null);

    try {
      await requestAccountDeletion();
      await auth.signOut();
      setConfirmation('');
      setIsConfirmingDeletion(false);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not request account deletion.');
    } finally {
      setIsDeleting(false);
    }
  }

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

  if (auth.status === 'unauthenticated') {
    return (
      <Screen>
        <ThemedView style={styles.header}>
          <ThemedText type="small" themeColor="textSecondary">
            Account
          </ThemedText>
          <ThemedText type="title">{mode === 'login' ? 'Sign in' : 'Create account'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
            Your library, episode logs, stats, and achievements are saved to your account.
          </ThemedText>
        </ThemedView>

        <AuthForm mode={mode} onSwitchMode={() => setMode((value) => (value === 'login' ? 'register' : 'login'))} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedView style={styles.header}>
        <ThemedText type="small" themeColor="textSecondary">
          Account
        </ThemedText>
        <ThemedText type="title">Profile</ThemedText>
      </ThemedView>

      <Card>
        <ThemedText type="small" themeColor="textSecondary">
          Signed in as
        </ThemedText>
        <ThemedText type="smallBold">{auth.user?.email ?? auth.user?.id ?? 'Current user'}</ThemedText>
      </Card>

      <Button label="Sign out" variant="secondary" onPress={() => void auth.signOut()} />

      <Card>
        <ThemedText type="subtitle">Request account deletion</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
          This submits a request to delete your Pilot 2 Finale account and immediately deletes app-owned tracking data.
        </ThemedText>
        <FormField label="Type DELETE to confirm" value={confirmation} onChangeText={setConfirmation} autoCapitalize="characters" />
        {error ? (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        ) : null}
        <Button
          label={isDeleting ? 'Submitting request...' : 'Request account deletion'}
          variant="danger"
          disabled={confirmation.trim().toUpperCase() !== 'DELETE' || isDeleting}
          onPress={() => setIsConfirmingDeletion(true)}
        />
      </Card>

      <ConfirmSheet
        visible={isConfirmingDeletion}
        title="Delete account data?"
        description="This action deletes saved shows, episode logs, ratings, notes, stats, and achievement progress, then records an account deletion request."
        confirmLabel={isDeleting ? 'Submitting...' : 'Confirm deletion'}
        onCancel={() => setIsConfirmingDeletion(false)}
        onConfirm={() => void deleteAccount()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.two,
  },
  description: {
    lineHeight: 20,
  },
  centerCard: {
    alignItems: 'center',
  },
});