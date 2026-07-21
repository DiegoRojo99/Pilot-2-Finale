import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { readJson } from "@/lib/http";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import { upsertShowCatalog } from "@/lib/show-catalog";
import { refreshUserShowProgress } from "@/lib/user-show-status";
import type { ShowStatus, UserShow } from "@/types";

export const runtime = "nodejs";

const USER_SHOW_SELECT = `
  SELECT
    us.id,
    us.tmdb_id,
    CASE
      WHEN s.name LIKE 'TMDB Show %' AND us.name IS NOT NULL AND us.name <> '' THEN us.name
      ELSE s.name
    END AS name,
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

type CreateShowPayload = {
  tmdb_id?: number;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string | null;
  first_air_date?: string | null;
  status?: ShowStatus;
  vote_average?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
};

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit({
    key: `api:${getClientAddress(request)}`,
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many requests, please try again later.",
  });

  if (rateLimited) return rateLimited;
  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;

  const { userId } = authResult.context;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const query = status
    ? `${USER_SHOW_SELECT} WHERE us.user_id = $1 AND us.status = $2 ORDER BY us.updated_at DESC`
    : `${USER_SHOW_SELECT} WHERE us.user_id = $1 ORDER BY us.updated_at DESC`;
  
  const { rows: shows } = status
    ? await db.query<UserShow>(query, [userId, status])
    : await db.query<UserShow>(query, [userId]);

  return NextResponse.json(shows);
}

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit({
    key: `api:${getClientAddress(request)}`,
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many requests, please try again later.",
  });

  if (rateLimited) return rateLimited;
  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) return authResult.response;

  const { userId } = authResult.context;
  const body = await readJson<CreateShowPayload>(request);
  if (!body?.tmdb_id || !body.name) return NextResponse.json({ error: "tmdb_id and name are required" }, { status: 400 });

  const status = body.status ?? "watching";
  if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  try {
    await upsertShowCatalog({
      tmdb_id: body.tmdb_id,
      name: body.name,
      poster_path: body.poster_path ?? null,
      backdrop_path: body.backdrop_path ?? null,
      overview: body.overview ?? null,
      first_air_date: body.first_air_date ?? null,
      vote_average: body.vote_average ?? 0,
      number_of_seasons: body.number_of_seasons ?? 0,
      number_of_episodes: body.number_of_episodes ?? 0,
    });
    
    await db.query(
      `
      INSERT INTO user_shows (
        user_id,
        tmdb_id,
        status
      )
      VALUES ($1, $2, $3)
      ON CONFLICT(user_id, tmdb_id) DO UPDATE SET
        status = excluded.status,
        updated_at = now()
      `,
      [userId, body.tmdb_id, status],
    );

    await refreshUserShowProgress(userId, body.tmdb_id);

    const show = await db.one<UserShow>(
      `${USER_SHOW_SELECT} WHERE us.user_id = $1 AND us.tmdb_id = $2`,
      [userId, body.tmdb_id],
    );
    return NextResponse.json(show, { status: 201 });
  } catch (error) {
    console.error("Error adding show:", error);
    return NextResponse.json({ error: "Failed to add show" }, { status: 500 });
  }
}
