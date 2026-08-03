"use client";

import { Analytics } from "@vercel/analytics/next";
import { authClient } from "@/lib/auth/client";

function getExcludedUserIdSet() {
  const raw = process.env.NEXT_PUBLIC_ANALYTICS_EXCLUDED_USER_IDS ?? "";
  const ids = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return new Set(ids);
}

export function VercelAnalytics() {
  const sessionQuery = authClient.useSession();
  const excludedUserIds = getExcludedUserIdSet();
  if (sessionQuery.isPending) return null;
  
  const currentUserId = sessionQuery.data?.user?.id;
  if (currentUserId && excludedUserIds.has(currentUserId)) return null;
  return <Analytics />;
}