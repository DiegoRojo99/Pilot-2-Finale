import { Modal, Pressable, StyleSheet } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type ConfirmSheetProps = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmSheet({ visible, title, description, confirmLabel, onCancel, onConfirm }: ConfirmSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <ThemedView style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <Card style={styles.sheet}>
          <ThemedText type="subtitle">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
            {description}
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={onCancel} style={styles.actionButton} />
            <Button label={confirmLabel} variant="danger" onPress={onConfirm} style={styles.actionButton} />
          </ThemedView>
        </Card>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.three,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    gap: Spacing.three,
  },
  description: {
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionButton: {
    flex: 1,
  },
});