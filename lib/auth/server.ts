import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL ?? "https://invalid.neon-auth.local";
const cookieSecret =
  process.env.NEON_AUTH_COOKIE_SECRET ?? "replace-this-fallback-cookie-secret-with-a-real-value";

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
  },
});
