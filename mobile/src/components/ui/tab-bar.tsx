import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export interface TabItem {
  id: string;
  label: string;
  icon?: string; // Ionicons name
  symbolIcon?: { ios: string; android: string; web: string }; // SF Symbols
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  useSymbols?: boolean; // Use SF Symbols instead of Ionicons
}

export function TabBar({ tabs, activeTab, onTabChange, useSymbols = false }: TabsProps) {
  const theme = useTheme();

  return (
    <View style={[styles.tabsContainer, { borderBottomColor: theme.border }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => onTabChange(tab.id)}
          style={[
            styles.tab,
            {
              borderBottomColor: activeTab === tab.id ? theme.accent : theme.backgroundSelected,
              borderBottomWidth: activeTab === tab.id ? 2 : 1,
            },
          ]}
        >
          {useSymbols && tab.symbolIcon ? (
            <SymbolView
              name={tab.symbolIcon}
              size={16}
              tintColor={activeTab === tab.id ? theme.accent : theme.textSecondary}
              style={styles.icon}
            />
          ) : tab.icon ? (
            <Ionicons
              name={activeTab === tab.id ? tab.icon : `${tab.icon}-outline`}
              size={16}
              color={activeTab === tab.id ? theme.accent : theme.textSecondary}
              style={styles.icon}
            />
          ) : null}
          <ThemedText
            type="small"
            style={[
              { 
                color: activeTab === tab.id ? theme.accent : theme.textSecondary,
                fontSize: 16,
                fontWeight: activeTab === tab.id ? '600' : '400',
              },
            ]}
          >
            {tab.label}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    gap: 0,
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    paddingBottom: 0,
  },
  tab: {
    flex: 1,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  icon: {
    marginRight: 2,
  },
});
