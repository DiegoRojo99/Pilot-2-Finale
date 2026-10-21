/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemePreference } from '@/components/theme/theme-provider';

export function useTheme() {
  const systemScheme = useColorScheme();
  const { preference } = useThemePreference();

  let scheme: 'light' | 'dark';

  if (preference === 'light') {
    scheme = 'light';
  } else if (preference === 'dark') {
    scheme = 'dark';
  } else {
    // system
    scheme = systemScheme === 'dark' ? 'dark' : 'light';
  }

  return Colors[scheme];
}
