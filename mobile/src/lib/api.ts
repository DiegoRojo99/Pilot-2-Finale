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

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (cookieHeader && Platform.OS !== 'web') {
    headers.set('Cookie', cookieHeader);
  }

  // Single request with retry on 429
  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(createApiUrl(path), {
        ...options,
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        const error = new ApiError(`Request failed with status ${response.status}`, response.status);

        // Retry only on 429, otherwise throw immediately
        if (response.status === 429 && attempt < 2) {
          const delayMs = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          lastError = error;
          continue;
        }

        throw error;
      }

      if (response.status === 204) return undefined as ResponseBody;
      return (await response.json()) as ResponseBody;
    } catch (error) {
      // If it's a 429 and we have retries, continue loop
      if (error instanceof ApiError && error.status === 429 && attempt < 2) {
        continue;
      }
      throw error;
    }
  }

  throw lastError || new ApiError('Request failed after retries', 429);
}

export function getHealth() {
  return apiRequest<HealthResponse>('/api/health');
}