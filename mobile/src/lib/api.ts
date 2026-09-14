import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getStoredAuthCookieHeader } from '@/lib/auth-storage';
import type { HealthResponse } from '@/types/api';

const DEFAULT_API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

type ExpoExtra = {
  apiBaseUrl?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getApiConfig() {
  const extra = Constants.expoConfig?.extra as ExpoExtra | undefined;
  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || extra?.apiBaseUrl?.trim();
  const baseUrl = configuredBaseUrl && configuredBaseUrl.length > 0 ? configuredBaseUrl : DEFAULT_API_BASE_URL;
  const hasConfiguredBaseUrl = baseUrl === configuredBaseUrl;

  return {
    baseUrl: baseUrl.replace(/\/+$/, ''),
    source: hasConfiguredBaseUrl ? 'app config' : 'platform default',
  };
}

export function getApiBaseUrl() {
  return getApiConfig().baseUrl;
}

export function createApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

export async function apiRequest<ResponseBody>(path: string, options: RequestInit = {}) {
  const cookieHeader = await getStoredAuthCookieHeader();
  const headers = new Headers({
    Accept: 'application/json',
    ...options.headers,
  });

  if (cookieHeader && Platform.OS !== 'web') {
    headers.set('Cookie', cookieHeader);
  }

  const response = await fetch(createApiUrl(path), {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!response.ok) throw new ApiError(`Request failed with status ${response.status}`, response.status);
  if (response.status === 204) return undefined as ResponseBody;
  return (await response.json()) as ResponseBody;
}

export function getHealth() {
  return apiRequest<HealthResponse>('/api/health');
}