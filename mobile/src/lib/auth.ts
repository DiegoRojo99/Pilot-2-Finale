import { apiRequest, createApiUrl } from '@/lib/api';
import { clearStoredAuthCookies, getStoredAuthCookieHeader, storeAuthCookiesFromResponse } from '@/lib/auth-storage';
import type { AuthEmailResponse, AuthSessionResponse } from '@/types/api';

type EmailCredentials = {
  email: string;
  password: string;
};

type RegisterCredentials = EmailCredentials & {
  name: string;
};

async function authFetch(path: string, body?: unknown) {
  const cookieHeader = await getStoredAuthCookieHeader();
  const headers = new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json',
  });

  if (cookieHeader) {
    headers.set('Cookie', cookieHeader);
  }

  const response = await fetch(createApiUrl(path), {
    method: body ? 'POST' : 'GET',
    credentials: 'include',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  await storeAuthCookiesFromResponse(response);

  const data = (await response.json().catch(() => null)) as AuthEmailResponse | AuthSessionResponse | { error?: string } | null;

  if (!response.ok) {
    const message =
      data &&
      'error' in data &&
      (typeof data.error === 'string' ? data.error : typeof data.error?.message === 'string' ? data.error.message : null);
    throw new Error(message || 'Authentication request failed.');
  }

  return data;
}

export async function getMobileSession() {
  try { return await authFetch('/api/auth/get-session') as Promise<AuthSessionResponse>; } 
  catch (error) {
    // Clear cookies on any auth-related error (expired, invalid, etc)
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid') || msg.includes('expired') || msg.includes('session') || msg.includes('auth')) {
        await clearStoredAuthCookies();
      }
    }
    throw error;
  }
}

export async function signInWithEmail({ email, password }: EmailCredentials) {
  await authFetch('/api/auth/sign-in/email', { email, password, rememberMe: true });
  return getMobileSession();
}

export async function registerWithEmail({ name, email, password }: RegisterCredentials) {
  await authFetch('/api/auth/sign-up/email', { name: name.trim() || email, email, password, rememberMe: true });
  return getMobileSession();
}

export async function signOut() {
  await authFetch('/api/auth/sign-out', {});
  await clearStoredAuthCookies();
}

export async function requestAccountDeletion() {
  await apiRequest('/api/account', { method: 'DELETE' });
}