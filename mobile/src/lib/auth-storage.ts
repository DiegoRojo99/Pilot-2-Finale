import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const AUTH_COOKIE_STORAGE_KEY = 'pilot2finale.auth.cookies';

function splitSetCookieHeader(header: string) {
  return header.split(/,(?=\s*[^;,\s]+=)/g).map((value) => value.trim()).filter(Boolean);
}

function cookiesToHeader(setCookieHeader: string) {
  return splitSetCookieHeader(setCookieHeader)
    .map((cookie) => cookie.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ');
}

async function getStorageItem(key: string) {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(key) ?? null;
  }

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

export async function getStoredAuthCookieHeader() {
  return getStorageItem(AUTH_COOKIE_STORAGE_KEY);
}

export async function storeAuthCookiesFromResponse(response: Response) {
  const setCookieHeader = response.headers.get('set-cookie');
  if (!setCookieHeader) return null;

  const cookieHeader = cookiesToHeader(setCookieHeader);
  if (!cookieHeader) return null;

  await setStorageItem(AUTH_COOKIE_STORAGE_KEY, cookieHeader);
  return cookieHeader;
}

export async function clearStoredAuthCookies() {
  await deleteStorageItem(AUTH_COOKIE_STORAGE_KEY);
}