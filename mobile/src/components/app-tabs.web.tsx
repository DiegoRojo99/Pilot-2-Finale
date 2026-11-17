import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { APP_TABS } from '@/constants/navigation';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  return (
    <Tabs style={styles.container}>
      <TabSlot style={styles.container} />
      <TabList asChild>
        <CustomTabList>
          {APP_TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton icon={tab.icon} accessibilityLabel={tab.label}>{tab.label}</TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = Omit<TabTriggerSlotProps, 'ref'> & {
  icon: (typeof APP_TABS)[number]['icon'];
};

export function TabButton({ children, icon, isFocused, ...props }: TabButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      aria-selected={Boolean(isFocused)}
      style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <ThemedView type={isFocused ? 'accent' : 'backgroundSelected'} style={styles.iconBadge}>
          <Ionicons name={icon} size={22} color={isFocused ? theme.accentText : theme.textSecondary} aria-hidden />
        </ThemedView>
        <ThemedText type="xxs" themeColor={isFocused ? 'text' : 'textSecondary'} numberOfLines={1}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View {...props} accessibilityRole="tablist" style={[styles.tabListContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border, paddingBottom: insets.bottom }]}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabListContainer: {
    width: '100%',
    borderTopWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  tabButton: { flex: 1, minWidth: 0 },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    minHeight: 60,
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  iconBadge: {
    width: 40,
    height: 28,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
