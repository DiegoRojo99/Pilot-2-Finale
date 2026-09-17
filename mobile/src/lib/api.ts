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

  // Retry logic with exponential backoff for 429 errors
  let lastError: ApiError | null = null;
  const maxAttempts = 5; // Increased from 3 to 5

  console.log(`[API] ${options.method || 'GET'} ${path}`);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(createApiUrl(path), {
        ...options,
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        let errorBody = '';
        try { errorBody = await response.text(); } 
        catch {
          // Ignore if we can't read body
        }

        const error = new ApiError(
          `Request failed with status ${response.status}: ${errorBody}`,
          response.status,
        );

        // Retry only on 429, otherwise throw immediately
        if (response.status === 429 && attempt < maxAttempts - 1) {
          // Exponential backoff: 1s, 2s, 4s, 8s
          const delayMs = Math.pow(2, attempt) * 1000;
          console.log(`[API] 429 on attempt ${attempt + 1}/${maxAttempts}, retrying after ${delayMs}ms`);
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
      if (error instanceof ApiError && error.status === 429 && attempt < maxAttempts - 1) {
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