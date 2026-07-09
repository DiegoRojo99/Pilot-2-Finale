import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { isNumericId, readJson } from "@/lib/http";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import { repairShowCatalogIfNeeded } from "@/lib/show-catalog";
import type { ShowStatus, UserShow } from "@/types";

export const runtime = "nodejs";

const USER_SHOW_SELECT = `
  SELECT
    us.id,
    us.tmdb_id,
    s.name,
    s.poster_path,
    s.backdrop_path,
    s.overview,
    s.first_air_date,
    us.status,
    s.vote_average,
    s.number_of_seasons,
    s.number_of_episodes,
    us.added_at,
    us.updated_at
  FROM user_shows us
  JOIN shows s ON s.tmdb_id = us.tmdb_id
`;

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

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) {
    return authResult.response;
  }
  const { userId } = authResult.context;

  const { tmdbId } = await params;
  let show = await db.one<UserShow>(`${USER_SHOW_SELECT} WHERE us.user_id = $1 AND us.tmdb_id = $2`, [
    userId,
    Number(tmdbId),
  ]);

  if (!show) {
    return NextResponse.json({ error: "Show not found in your list" }, { status: 404 });
  }

  if (await repairShowCatalogIfNeeded(show)) {
    show = await db.one<UserShow>(`${USER_SHOW_SELECT} WHERE us.user_id = $1 AND us.tmdb_id = $2`, [
      userId,
      Number(tmdbId),
    ]);
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

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) {
    return authResult.response;
  }
  const { userId } = authResult.context;

  const { tmdbId } = await params;

  if (!isNumericId(tmdbId)) {
    return NextResponse.json({ error: "Invalid show ID" }, { status: 400 });
  }

  const body = await readJson<{ status?: ShowStatus }>(request);
  const status = body?.status;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const result = await db.query(
    "UPDATE user_shows SET status = $1, updated_at = now() WHERE user_id = $2 AND tmdb_id = $3 RETURNING tmdb_id",
    [status, userId, Number(tmdbId)],
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Show not found in your list" }, { status: 404 });
  }

  const show = await db.one(`${USER_SHOW_SELECT} WHERE us.user_id = $1 AND us.tmdb_id = $2`, [
    userId,
    Number(tmdbId),
  ]);
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

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) {
    return authResult.response;
  }
  const { userId } = authResult.context;

  const { tmdbId } = await params;
  const result = await db.query("DELETE FROM user_shows WHERE user_id = $1 AND tmdb_id = $2 RETURNING tmdb_id", [
    userId,
    Number(tmdbId),
  ]);

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Show not found in your list" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
