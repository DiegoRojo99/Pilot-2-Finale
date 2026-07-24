import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { isNumericId, readJson } from "@/lib/http";
import { fetchUserShowByTmdbId } from "@/lib/data/user-shows";
import { defaultRateLimit } from "@/lib/rate-limit";
import { repairShowCatalogIfNeeded } from "@/lib/show-catalog";
import type { ShowStatus } from "@/types";

export const runtime = "nodejs";

const VALID_STATUSES: ShowStatus[] = ["watching", "want_to_watch", "watched", "dropped", "on_hold"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tmdbId: string }> },
) {
  const rateLimited = defaultRateLimit(request);
  if (rateLimited) return rateLimited;

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;

  const { userId } = authResult.context;
  const { tmdbId } = await params;
  const numericTmdbId = Number(tmdbId);

  let show = await fetchUserShowByTmdbId(userId, numericTmdbId);
  if (!show) return NextResponse.json({ error: "Show not found in your list" }, { status: 404 });

  const repairResult = await repairShowCatalogIfNeeded(show);
  if (repairResult) {
    show = await fetchUserShowByTmdbId(userId, numericTmdbId);
    if (!show) return NextResponse.json({ error: "Show not found in your list" }, { status: 404 });
  }

  return NextResponse.json(show);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tmdbId: string }> },
) {
  const rateLimited = defaultRateLimit(request);

  if (rateLimited) return rateLimited;
  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;

  const { userId } = authResult.context;
  const { tmdbId } = await params;
  if (!isNumericId(tmdbId)) return NextResponse.json({ error: "Invalid show ID" }, { status: 400 });

  const body = await readJson<{ status?: ShowStatus }>(request);
  const status = body?.status;
  if (!status || !VALID_STATUSES.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const numericTmdbId = Number(tmdbId);
  const updateResult = await prisma.userShow.updateMany({
    where: {
      userId,
      tmdbId: numericTmdbId,
    },
    data: {
      status,
      updatedAt: new Date(),
    },
  });

  if (updateResult.count === 0) return NextResponse.json({ error: "Show not found in your list" }, { status: 404 });
  const show = await fetchUserShowByTmdbId(userId, numericTmdbId);
  if (!show) return NextResponse.json({ error: "Show not found in your list" }, { status: 404 });
  return NextResponse.json(show);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tmdbId: string }> },
) {
  const rateLimited = defaultRateLimit(request);

  if (rateLimited) return rateLimited;
  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;

  const { userId } = authResult.context;
  const { tmdbId } = await params;
  const deleteResult = await prisma.userShow.deleteMany({
    where: {
      userId,
      tmdbId: Number(tmdbId),
    },
  });

  if (deleteResult.count === 0) return NextResponse.json({ error: "Show not found in your list" }, { status: 404 });
  return NextResponse.json({ success: true });
}
