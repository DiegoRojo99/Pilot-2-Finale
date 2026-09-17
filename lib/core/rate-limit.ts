import { NextResponse } from "next/server";

type RateLimitOptions = {
  key: string;
  windowMs: number;
  max: number;
  message: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  pilot2FinaleRateLimits?: Map<string, RateLimitEntry>;
};

const rateLimitStore = globalForRateLimit.pilot2FinaleRateLimits ?? new Map<string, RateLimitEntry>();

if (!globalForRateLimit.pilot2FinaleRateLimits) {
  globalForRateLimit.pilot2FinaleRateLimits = rateLimitStore;
}

export function getClientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "anonymous";
}

export function enforceRateLimit({ key, windowMs, max, message }: RateLimitOptions) {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (existing.count >= max) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return NextResponse.json(
      { error: message },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter), },
      },
    );
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);
  return null;
}

export function defaultRateLimit(request: Request) {
  return enforceRateLimit({
    key: `api:${getClientAddress(request)}`,
    windowMs: 15 * 60 * 1000,
    max: 600, // Increased from 300 to support mobile app navigation patterns
    message: "Too many requests, please try again later.",
  });
}