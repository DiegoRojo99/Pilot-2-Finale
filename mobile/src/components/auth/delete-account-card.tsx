import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { FormField } from '@/components/ui/form-field';
import { requestAccountDeletion } from '@/lib/auth';
import { useAuth } from '@/components/auth/auth-provider';

export function DeleteAccountCard({ onClose }: { onClose: () => void }) {
  const auth = useAuth();
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

  return (
    <>
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
        <Button label="Cancel" variant="secondary" onPress={onClose} />
      </Card>

      <ConfirmSheet
        visible={isConfirmingDeletion}
        title="Delete account data?"
        description="This action deletes saved shows, episode logs, ratings, notes, stats, and achievement progress, then records an account deletion request."
        confirmLabel={isDeleting ? 'Submitting...' : 'Confirm deletion'}
        onCancel={() => setIsConfirmingDeletion(false)}
        onConfirm={() => void deleteAccount()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  description: {
    lineHeight: 20,
  },
});
