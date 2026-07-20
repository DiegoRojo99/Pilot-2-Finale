import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";

function getAdminUserIdSet() {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  const ids = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return new Set(ids);
}

export function isAdminUserId(userId: string | null | undefined) {
  if (!userId) return false;
  const adminIds = getAdminUserIdSet();
  console.log("Admin IDs:", Array.from(adminIds)); // Debugging line
  console.log("Checking user ID:", userId); // Debugging line
  return adminIds.has(userId);
}

export async function requireAdminUser(): Promise<
  { context: { userId: string } } | { response: NextResponse }
> {
  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult;

  if (!isAdminUserId(authResult.context.userId)) {
    return {
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  return authResult;
}
