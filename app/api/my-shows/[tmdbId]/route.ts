import { NextResponse } from "next/server";
import db from "@/lib/db";
import { isNumericId, readJson } from "@/lib/http";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import type { ShowStatus } from "@/types";

export const runtime = "nodejs";

const VALID_STATUSES: ShowStatus[] = ["watching", "want_to_watch", "watched", "dropped", "on_hold"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tmdbId: string }> },
) {
  const rateLimited = enforceRateLimit({
    key: `api:${getClientAddress(request)}`,
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many requests, please try again later.",
  });

  if (rateLimited) {
    return rateLimited;
  }

  const { tmdbId } = await params;
  const show = db.prepare("SELECT * FROM user_shows WHERE tmdb_id = ?").get(tmdbId);

  if (!show) {
    return NextResponse.json({ error: "Show not found in your list" }, { status: 404 });
  }

  return NextResponse.json(show);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tmdbId: string }> },
) {
  const rateLimited = enforceRateLimit({
    key: `api:${getClientAddress(request)}`,
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many requests, please try again later.",
  });

  if (rateLimited) {
    return rateLimited;
  }

  const { tmdbId } = await params;

  if (!isNumericId(tmdbId)) {
    return NextResponse.json({ error: "Invalid show ID" }, { status: 400 });
  }

  const body = await readJson<{ status?: ShowStatus }>(request);
  const status = body?.status;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const result = db
    .prepare("UPDATE user_shows SET status = ?, updated_at = datetime('now') WHERE tmdb_id = ?")
    .run(status, tmdbId);

  if (result.changes === 0) {
    return NextResponse.json({ error: "Show not found in your list" }, { status: 404 });
  }

  const show = db.prepare("SELECT * FROM user_shows WHERE tmdb_id = ?").get(tmdbId);
  return NextResponse.json(show);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tmdbId: string }> },
) {
  const rateLimited = enforceRateLimit({
    key: `api:${getClientAddress(request)}`,
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many requests, please try again later.",
  });

  if (rateLimited) {
    return rateLimited;
  }

  const { tmdbId } = await params;
  const result = db.prepare("DELETE FROM user_shows WHERE tmdb_id = ?").run(tmdbId);

  if (result.changes === 0) {
    return NextResponse.json({ error: "Show not found in your list" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
