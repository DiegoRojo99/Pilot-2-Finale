import { ScrollView, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PlaceholderScreenProps = {
  title: string;
  eyebrow: string;
  description: string;
  tasks: string[];
  children?: ReactNode;
};

function PlaceholderTasks({ tasks }: { tasks: string[] }) {
  if (tasks.length === 0) return null;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="subtitle">Next tasks</ThemedText>
      {tasks.map((task) => (
        <ThemedView key={task} style={styles.taskRow}>
          <ThemedView type="backgroundSelected" style={styles.taskDot} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.taskText}>
            {task}
          </ThemedText>
        </ThemedView>
      ))}
    </ThemedView>
  );
}

export function PlaceholderScreen({ title, eyebrow, description, tasks, children }: PlaceholderScreenProps) {
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="small" themeColor="textSecondary">
            {eyebrow}
          </ThemedText>
          <ThemedText type="title">{title}</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.description}>
            {description}
          </ThemedText>
        </ThemedView>

        {children ?? <PlaceholderTasks tasks={tasks} />}
      </SafeAreaView>
    </ScrollView>
  );
}

PlaceholderScreen.Tasks = PlaceholderTasks;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.two,
  },
  description: {
    maxWidth: 460,
    lineHeight: 22,
  },
  card: {
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
  },
  taskText: {
    flex: 1,
    lineHeight: 20,
  },
});