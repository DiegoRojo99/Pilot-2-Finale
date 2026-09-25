import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AuthProvider } from '@/components/auth/auth-provider';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="discover/trending-all"
            options={{
              headerShown: true,
              headerTitle: 'Trending Now',
              headerTintColor: colorScheme === 'dark' ? '#f8fafc' : '#0f172a',
            }}
          />
          <Stack.Screen
            name="discover/top-rated-all"
            options={{
              headerShown: true,
              headerTitle: 'Top Rated',
              headerTintColor: colorScheme === 'dark' ? '#f8fafc' : '#0f172a',
            }}
          />
          <Stack.Screen
            name="show/[id]"
            options={{
              headerShown: true,
              headerTransparent: true,
              headerTitle: '',
              headerTintColor: colorScheme === 'dark' ? '#f8fafc' : '#0f172a',
            }}
          />
          <Stack.Screen
            name="show/[id]/season/[seasonNumber]/episode/[episodeNumber]"
            options={{
              headerShown: true,
              headerTransparent: true,
              headerTitle: '',
              headerTintColor: colorScheme === 'dark' ? '#f8fafc' : '#0f172a',
            }}
          />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
