import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

const tabs = [
  { name: 'index', label: 'Discover', sf: 'magnifyingglass', md: 'search' },
  { name: 'my-shows', label: 'My Shows', sf: 'tv', md: 'live_tv' },
  { name: 'diary', label: 'Diary', sf: 'book.circle', md: 'note_alt' },
  { name: 'stats', label: 'Stats', sf: 'chart.bar', md: 'bar_chart' },
  { name: 'profile', label: 'Profile', sf: 'person.crop.circle', md: 'account_circle' },
] as const;

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      {tabs.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={tab.sf} md={tab.md} selectedColor={colors.accent} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
