import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { readJson } from "@/lib/http";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import type { ShowStatus } from "@/types";

export const runtime = "nodejs";

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

  if (rateLimited) {
    return rateLimited;
  }

  const authResult = await requireAuthenticatedUser();
  if ("response" in authResult) {
    return authResult.response;
  }
  const { userId } = authResult.context;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const query = status
    ? "SELECT * FROM user_shows WHERE user_id = $1 AND status = $2 ORDER BY updated_at DESC"
    : "SELECT * FROM user_shows WHERE user_id = $1 ORDER BY updated_at DESC";
  const { rows: shows } = status ? await db.query(query, [userId, status]) : await db.query(query, [userId]);

  return NextResponse.json(shows);
}

export async function POST(request: Request) {
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

  const body = await readJson<CreateShowPayload>(request);

  if (!body?.tmdb_id || !body.name) {
    return NextResponse.json({ error: "tmdb_id and name are required" }, { status: 400 });
  }

  const status = body.status ?? "watching";

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    await db.query(
      `
      INSERT INTO user_shows (
        user_id,
        tmdb_id,
        name,
        poster_path,
        backdrop_path,
        overview,
        first_air_date,
        status,
        vote_average,
        number_of_seasons,
        number_of_episodes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT(user_id, tmdb_id) DO UPDATE SET
        name = excluded.name,
        poster_path = excluded.poster_path,
        backdrop_path = excluded.backdrop_path,
        overview = excluded.overview,
        first_air_date = excluded.first_air_date,
        status = excluded.status,
        vote_average = excluded.vote_average,
        number_of_seasons = excluded.number_of_seasons,
        number_of_episodes = excluded.number_of_episodes,
        updated_at = now()
      `,
      [
        userId,
        body.tmdb_id,
        body.name,
        body.poster_path ?? null,
        body.backdrop_path ?? null,
        body.overview ?? null,
        body.first_air_date ?? null,
        status,
        body.vote_average ?? 0,
        body.number_of_seasons ?? 0,
        body.number_of_episodes ?? 0,
      ],
    );

    const show = await db.one("SELECT * FROM user_shows WHERE user_id = $1 AND tmdb_id = $2", [
      userId,
      body.tmdb_id,
    ]);
    return NextResponse.json(show, { status: 201 });
  } catch (error) {
    console.error("Error adding show:", error);
    return NextResponse.json({ error: "Failed to add show" }, { status: 500 });
  }
}
