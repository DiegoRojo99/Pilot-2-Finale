import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SafeArea } from '@/constants/theme';

/**
 * Hook to get safe area insets based on the design system tokens
 * Handles platform-specific (iOS/Android) safe area configurations
 *
 * @returns Object with top and bottom safe area insets
 *
 * @example
 * const { top, bottom } = useSafeAreaInsets();
 * <View style={{ paddingTop: top, paddingBottom: bottom }}>
 *   Content
 * </View>
 */
export function useSafeArea() {
  const insets = useSafeAreaInsets();

  return {
    top: insets.top > 0 ? insets.top : SafeArea.top,
    bottom: insets.bottom > 0 ? insets.bottom : SafeArea.bottom,
    left: insets.left,
    right: insets.right,
  };
}
