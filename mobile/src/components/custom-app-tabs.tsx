import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { APP_TABS } from '@/constants/navigation';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  return (
    <Tabs
      style={styles.container}
      options={Platform.OS === 'android' ? { backBehavior: 'initialRoute' } : undefined}>
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
      accessibilityState={{ selected: Boolean(isFocused) }}
      aria-selected={Boolean(isFocused)}
      style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <ThemedView
        type="backgroundElement"
        style={styles.tabButtonView}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={22} color={isFocused ? theme.accent : theme.textSecondary} aria-hidden />
        </View>
        <ThemedText type="xxs" themeColor={isFocused ? 'accent' : 'textSecondary'} numberOfLines={1}>
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
  tabButton: { flex: 1, minWidth: 0, paddingVertical: Spacing.one },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    minHeight: Platform.OS === 'android' ? 52 : 60,
    alignItems: 'center',
    gap: Platform.OS === 'android' ? Spacing.half : Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  iconContainer: {
    width: 40,
    height: Platform.OS === 'android' ? 24 : 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
