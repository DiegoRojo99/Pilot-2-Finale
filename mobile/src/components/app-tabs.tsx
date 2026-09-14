import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import exploreIcon from '@/assets/images/tabIcons/explore.png';
import homeIcon from '@/assets/images/tabIcons/home.png';
import { Colors } from '@/constants/theme';

const tabs = [
  { name: 'index', label: 'Discover', icon: homeIcon },
  { name: 'my-shows', label: 'My Shows', icon: exploreIcon },
  { name: 'history', label: 'History', icon: exploreIcon },
  { name: 'stats', label: 'Stats', icon: exploreIcon },
  { name: 'profile', label: 'Profile', icon: homeIcon },
];

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
          <NativeTabs.Trigger.Icon src={tab.icon} renderingMode="template" />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
