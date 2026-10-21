import { DarkTheme, DefaultTheme, Stack, ThemeProvider as ExpoThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AuthProvider } from '@/components/auth/auth-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <ExpoThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <ThemeProvider>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
            }}
          >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="discover/trending-all"
            options={{
              headerShown: true,
              headerTitle: 'Trending Now',
              headerTintColor: colors.text,
              headerStyle: {
                backgroundColor: colors.surfaceBackground,
              },
              headerShadowVisible: false,
              gestureDirection: 'horizontal',
            }}
          />
          <Stack.Screen
            name="discover/top-rated-all"
            options={{
              headerShown: true,
              headerTitle: 'Top Rated',
              headerTintColor: colors.text,
              headerStyle: {
                backgroundColor: colors.surfaceBackground,
              },
              headerShadowVisible: false,
              gestureDirection: 'horizontal',
            }}
          />
          <Stack.Screen
            name="achievements"
            options={{
              headerShown: true,
              headerTitle: 'Achievements',
              headerTintColor: colors.text,
              headerStyle: {
                backgroundColor: colors.surfaceBackground,
              },
              headerShadowVisible: false,
              gestureDirection: 'horizontal',
            }}
          />
          <Stack.Screen
            name="show/[id]"
            options={{
              headerShown: true,
              headerTransparent: true,
              headerTitle: '',
              headerTintColor: colors.text,
              gestureDirection: 'horizontal',
            }}
          />
          <Stack.Screen
            name="show/[id]/season/[seasonNumber]/episode/[episodeNumber]"
            options={{
              headerShown: true,
              headerTransparent: true,
              headerTitle: '',
              headerTintColor: colors.text,
              gestureDirection: 'horizontal',
            }}
          />
        </Stack>
        </AuthProvider>
      </ThemeProvider>
    </ExpoThemeProvider>
  );
}
