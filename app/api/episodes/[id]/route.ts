import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { deleteEpisodeLogById, updateEpisodeLogById } from "@/lib/episodes";
import { reconcileUserShowStatus, updateNextEpisodeToWatch } from "@/lib/shows";
import { defaultRateLimit } from "@/lib/core";

export const runtime = "nodejs";

type EpisodeLogPatchPayload = {
  watched_at?: string | null;
  rating?: number | null;
  notes?: string | null;
};

function normalizeRating(value: unknown): number | null | "invalid" {
  if (value === undefined || value === null || value === "") return null;

  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10) return "invalid";

  return parsed;
}

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
  
  await updateNextEpisodeToWatch(userId, tmdbShowId);
  await reconcileUserShowStatus(userId, tmdbShowId);
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = defaultRateLimit(request);
  if (rateLimited) return rateLimited;

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;

  const { userId } = authResult.context;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as EpisodeLogPatchPayload | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const normalizedRating = normalizeRating(body.rating);
  if (normalizedRating === "invalid") {
    return NextResponse.json({ error: "rating must be between 0 and 10" }, { status: 400 });
  }

  const updated = await updateEpisodeLogById(userId, Number(id), {
    watchedAt: body.watched_at,
    rating: normalizedRating,
    notes: body.notes,
  });

  if (!updated) return NextResponse.json({ error: "Episode log not found" }, { status: 404 });

  await updateNextEpisodeToWatch(userId, updated.tmdb_show_id);
  await reconcileUserShowStatus(userId, updated.tmdb_show_id);

  return NextResponse.json(updated);
}
