const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function tmdbFetch<T>(
  pathname: string,
  params: Record<string, string | number | boolean | undefined> = {},
) {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error("TMDB_API_KEY is not configured.");
  }

  const url = new URL(pathname, TMDB_BASE_URL);
  url.searchParams.set("api_key", apiKey);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
