import { NativeTabs } from 'expo-router/native-tabs';
import { useTheme } from '@/hooks/use-theme';
import { APP_TABS } from '@/constants/navigation';

export default function AppTabs() {
  const colors = useTheme();

  return (
    <NativeTabs
      backgroundColor={colors.surfaceBackground}
      disableIndicator
      iconColor={{ default: colors.textSecondary, selected: colors.accent }}
      labelVisibilityMode="labeled"
      labelStyle={{ 
        default: { 
          color: colors.textSecondary, 
          fontSize: 11,
          fontWeight: '500',
        },
        selected: { 
          color: colors.accent,
          fontSize: 11,
          fontWeight: '600',
        } 
      }}>
      {APP_TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name} accessibilityLabel={tab.label}>
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={tab.sf} md={tab.md} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
