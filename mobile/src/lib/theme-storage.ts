import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const THEME_PREFERENCE_KEY = 'pilot2finale.preferences.theme';
export type ThemePreference = 'light' | 'dark' | 'system';

async function getStorageItem(key: string) {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function setStorageItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteStorageItem(key: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function getThemePreference(): Promise<ThemePreference> {
  const stored = await getStorageItem(THEME_PREFERENCE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

export async function setThemePreference(preference: ThemePreference) {
  await setStorageItem(THEME_PREFERENCE_KEY, preference);
}

export async function clearThemePreference() {
  await deleteStorageItem(THEME_PREFERENCE_KEY);
}
