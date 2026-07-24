import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { deleteEpisodeLogById } from "@/lib/data/episode-logs";
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
  const tmdbShowId = await deleteEpisodeLogById(userId, Number(id));

  if (!tmdbShowId) return NextResponse.json({ error: "Episode log not found" }, { status: 404 });
  await reconcileUserShowStatus(userId, tmdbShowId);
  return NextResponse.json({ success: true });
}
