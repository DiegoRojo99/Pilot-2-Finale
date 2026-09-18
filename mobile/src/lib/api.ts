import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getStoredAuthCookieHeader } from '@/lib/auth-storage';
import type { HealthResponse } from '@/types/api';

const DEFAULT_API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

type SessionRefreshHandler = () => Promise<boolean>;
let sessionRefreshHandler: SessionRefreshHandler | null = null;
export function setSessionRefreshHandler(handler: SessionRefreshHandler | null) {
  sessionRefreshHandler = handler;
}

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

export async function apiRequest<ResponseBody>(
  path: string,
  options: RequestInit = {},
) {
  const maxAttempts = 2;
  let lastError: ApiError | null = null;

  console.log(`[API] ${options.method || 'GET'} ${path}`);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const cookieHeader = await getStoredAuthCookieHeader();
    const headers = new Headers({
      Accept: 'application/json',
      ...options.headers,
    });

    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (cookieHeader && Platform.OS !== 'web') headers.set('Cookie', cookieHeader);

    try {
      const response = await fetch(createApiUrl(path), {
        ...options,
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        let errorBody = '';

        try { errorBody = await response.text(); } 
        catch {}

        const error = new ApiError(
          `Request failed with status ${response.status}: ${errorBody}`,
          response.status,
        );

        // Authentication failed. Give the session one chance to refresh.
        if (
          (response.status === 401 || response.status === 403) &&
          attempt === 0 &&
          sessionRefreshHandler
        ) {
          console.log('[API] Authentication failed, attempting session refresh');
          const refreshed = await sessionRefreshHandler();
          if (refreshed) {
            console.log('[API] Session refreshed, retrying request');
            continue;
          }
        }

        // Keep your existing 429 retry behavior.
        if (response.status === 429 && attempt < maxAttempts - 1) {
          const delayMs = Math.pow(2, attempt) * 1000;
          console.log( `[API] 429 on attempt ${attempt + 1}/${maxAttempts}, retrying after ${delayMs}ms`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          lastError = error;
          continue;
        }

        throw error;
      }

      if (response.status === 204) return undefined as ResponseBody;
      return (await response.json()) as ResponseBody;
    } 
    catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      const status = apiError?.status; 
      if ( status === 429 && attempt < maxAttempts - 1) continue;
      throw error;
    }
  }

  throw lastError || new ApiError('Request failed after retries', 429);
}

export function getHealth() {
  return apiRequest<HealthResponse>('/api/health');
}