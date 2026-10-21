import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { DeleteAccountCard } from '@/components/auth/delete-account-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createApiUrl } from '@/lib/api';

type PrivacyModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function PrivacyDataModal({ visible, onClose }: PrivacyModalProps) {
  const theme = useTheme();
  const [showDeleteCard, setShowDeleteCard] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
            <ThemedText type="smallBold">✕</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">Privacy & Data</ThemedText>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <ThemedText type="subtitle">Your Data</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
              Pilot 2 Finale stores your shows, episode logs, ratings, notes, and achievement progress locally and on our servers.
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle">Privacy Policy</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
              Read our full privacy policy to understand how we collect, use, and protect your data.
            </ThemedText>
            <Button
              label="Read Privacy Policy"
              variant="secondary"
              onPress={() => void Linking.openURL(createApiUrl('/privacy'))}
            />
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle">Account Deletion</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
              Request to permanently delete your account and all associated data.
            </ThemedText>
            {!showDeleteCard && (
              <Button
                label="Request Account Deletion"
                variant="danger"
                onPress={() => setShowDeleteCard(true)}
              />
            )}
            {showDeleteCard && <DeleteAccountCard onClose={() => setShowDeleteCard(false)} />}
          </View>
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.sm,
  },
  description: {
    lineHeight: 20,
  },
});
