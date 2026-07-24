import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { defaultRateLimit } from "@/lib/rate-limit";
import { reconcileUserShowStatus } from "@/lib/user-show-status";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = defaultRateLimit(request);
  if (rateLimited) return rateLimited;

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;

  const { userId } = authResult.context;
  const { id } = await params;
  const result = await db.query<{ id: number; tmdb_show_id: number }>(
    `
      DELETE FROM watch_entries we
      USING episodes e
      WHERE we.user_id = $1
        AND we.id = $2
        AND e.id = we.episode_id
      RETURNING we.id, e.tmdb_show_id
    `,
    [
      userId,
      Number(id),
    ],
  );

  if (result.rows.length === 0) return NextResponse.json({ error: "Episode log not found" }, { status: 404 });
  await reconcileUserShowStatus(userId, result.rows[0].tmdb_show_id);
  return NextResponse.json({ success: true });
}
