import { NativeTabs } from 'expo-router/native-tabs';
import { useTheme } from '@/hooks/use-theme';

const tabs = [
  { name: 'index', label: 'Up Next', sf: 'play.circle', md: 'play_circle' },
  { name: 'discover', label: 'Discover', sf: 'magnifyingglass', md: 'search' },
  { name: 'calendar', label: 'Calendar', sf: 'calendar', md: 'calendar_month' },
  { name: 'my-shows', label: 'My Shows', sf: 'tv', md: 'live_tv' },
  { name: 'profile', label: 'Profile', sf: 'person.crop.circle', md: 'account_circle' },
] as const;

export default function AppTabs() {
  const colors = useTheme();

  return (
    <NativeTabs
      backgroundColor={colors.surfaceBackground}
      indicatorColor={colors.accent}
      labelStyle={{ 
        default: { 
          color: colors.textSecondary, 
          fontSize: 11,
          fontWeight: '500',
        },
        selected: { 
          color: colors.text, 
          fontSize: 11,
          fontWeight: '600',
        } 
      }}>
      {tabs.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={tab.sf} md={tab.md} selectedColor={colors.text} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
