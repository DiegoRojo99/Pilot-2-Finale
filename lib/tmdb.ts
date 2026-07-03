const TMDB_BASE_URL = "https://api.themoviedb.org/3";

interface TMDBFetchOptions {
  pathname: string;
  params?: Record<string, string | number | boolean | undefined>;
}

export async function tmdbFetch<T>({ pathname, params = {} }: TMDBFetchOptions) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY is not configured.");

  const url = new URL(`${TMDB_BASE_URL}${pathname}`);
  url.searchParams.set("api_key", apiKey);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, { cache: "no-store" });

  const text = await response.text();
  if (!response.ok) throw new Error(`TMDB request failed with status ${response.status}: ${text}`);
  if (!text) throw new Error(`TMDB returned an empty body for ${pathname}`);

  try { return JSON.parse(text) as T; } 
  catch { throw new Error(`TMDB returned non-JSON for ${pathname}: ${text.slice(0, 200)}`); }
}
