import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getApiBaseUrl, getApiConfig, getHealth, type HealthResponse } from '@/lib/api';

type ConnectionStatus = 'loading' | 'success' | 'error';

export default function HomeScreen() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('loading');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const apiConfig = getApiConfig();

  async function checkConnection() {
    setConnectionStatus('loading');

    try {
      const healthResponse = await getHealth();
      setHealth(healthResponse);
      setConnectionStatus('success');
    } catch {
      setHealth(null);
      setConnectionStatus('error');
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function checkInitialConnection() {
      try {
        const healthResponse = await getHealth();

        if (!isMounted) return;
        setHealth(healthResponse);
        setConnectionStatus('success');
      } catch {
        if (!isMounted) return;
        setHealth(null);
        setConnectionStatus('error');
      }
    }

    void checkInitialConnection();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="small" themeColor="textSecondary">
            Pilot 2 Finale Mobile
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            Track the next episode without opening a browser.
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="subtitle">Backend connection</ThemedText>
          <ThemedText themeColor="textSecondary">{getApiBaseUrl()}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Source: {apiConfig.source}
          </ThemedText>

          {connectionStatus === 'loading' && (
            <ThemedText type="small" themeColor="textSecondary">
              Checking the Next.js API...
            </ThemedText>
          )}

          {connectionStatus === 'success' && health && (
            <ThemedView style={styles.statusBlock}>
              <ThemedText type="smallBold">Connected</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                API status: {health.status}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Last checked: {new Date(health.timestamp).toLocaleString()}
              </ThemedText>
            </ThemedView>
          )}

          {connectionStatus === 'error' && (
            <ThemedView style={styles.statusBlock}>
              <ThemedText type="smallBold">Could not reach the API</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Make sure the Next.js app is running and your EXPO_PUBLIC_API_BASE_URL matches your
                device or emulator.
              </ThemedText>
            </ThemedView>
          )}

          <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={checkConnection}>
            <ThemedText type="smallBold">Check again</ThemedText>
          </Pressable>
        </ThemedView>

        <ThemedText type="small" themeColor="textSecondary" style={styles.lesson}>
          This first screen is intentionally small: it proves the mobile app can call the existing
          backend before we build auth, search, and tracking screens.
        </ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    gap: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  header: {
    gap: Spacing.two,
  },
  title: {
    maxWidth: 360,
  },
  card: {
    alignSelf: 'stretch',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  statusBlock: {
    gap: Spacing.one,
  },
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Spacing.three,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  lesson: {
    maxWidth: 420,
  },
});
