const DEFAULT_API_BASE_URL = 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getApiBaseUrl() {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  const baseUrl = configuredBaseUrl && configuredBaseUrl.length > 0 ? configuredBaseUrl : DEFAULT_API_BASE_URL;
  return baseUrl.replace(/\/+$/, '');
}

export function createApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

export async function apiRequest<ResponseBody>(path: string, options: RequestInit = {}) {
  const response = await fetch(createApiUrl(path), {
    ...options,
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) throw new ApiError(`Request failed with status ${response.status}`, response.status);
  if (response.status === 204) return undefined as ResponseBody;
  return (await response.json()) as ResponseBody;
}