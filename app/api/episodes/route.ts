import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { readJson } from "@/lib/http";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

type EpisodeLogPayload = {
  tmdb_show_id?: number;
  season_number?: number;
  episode_number?: number;
  episode_name?: string | null;
  rating?: number | null;
  notes?: string | null;
  watched_at?: string | null;
  episodes?: Array<{
    season_number?: number;
    episode_number?: number;
    episode_name?: string | null;
    rating?: number | null;
    notes?: string | null;
    watched_at?: string | null;
  }>;
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
  const tmdbShowId = searchParams.get("tmdb_show_id");
  const limit = Number(searchParams.get("limit") ?? "50");
  const offset = Number(searchParams.get("offset") ?? "0");

  if (tmdbShowId) {
    const { rows: logs } = await db.query(
      `
        SELECT el.*, us.name as show_name, us.poster_path
        FROM episode_logs el
        JOIN user_shows us ON el.tmdb_show_id = us.tmdb_id AND el.user_id = us.user_id
        WHERE el.user_id = $1 AND el.tmdb_show_id = $2
        ORDER BY el.season_number ASC, el.episode_number ASC
        LIMIT $3 OFFSET $4
      `,
      [userId, Number(tmdbShowId), limit, offset],
    );

    return NextResponse.json(logs);
  }

  const { rows: logs } = await db.query(
    `
      SELECT el.*, us.name as show_name, us.poster_path
      FROM episode_logs el
      JOIN user_shows us ON el.tmdb_show_id = us.tmdb_id AND el.user_id = us.user_id
      WHERE el.user_id = $1
      ORDER BY el.watched_at DESC
      LIMIT $2 OFFSET $3
    `,
    [userId, limit, offset],
  );

  return NextResponse.json(logs);
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
  if ("response" in authResult) return authResult.response;
  const { userId } = authResult.context;
  const body = await readJson<EpisodeLogPayload>(request);
  if (!body?.tmdb_show_id) return NextResponse.json({ error: "tmdb_show_id is required" }, { status: 400 });

  const show = await db.one("SELECT id FROM user_shows WHERE user_id = $1 AND tmdb_id = $2", [
    userId,
    body.tmdb_show_id,
  ]);

  if (!show) return NextResponse.json({ error: "Show not in your list. Add it first." }, { status: 404 });
  const isBulk = Array.isArray(body.episodes);

  if (isBulk) {
    const episodes = body.episodes ?? [];
    if (episodes.length === 0) return NextResponse.json({ error: "episodes must contain at least one item" }, { status: 400 });

    const hasInvalidEpisode = episodes.some((episode) => episode.season_number === undefined || episode.episode_number === undefined);

    if (hasInvalidEpisode) {
      return NextResponse.json(
        { error: "Each episode requires season_number and episode_number" },
        { status: 400 },
      );
    }

    try {
      const { rows } = await db.query<{ count: string }>(
        `
        WITH payload AS (
          SELECT *
          FROM jsonb_to_recordset($3::jsonb) AS episode(
            season_number INTEGER,
            episode_number INTEGER,
            episode_name TEXT,
            rating INTEGER,
            notes TEXT,
            watched_at TEXT
          )
        ), upserted AS (
          INSERT INTO episode_logs (
            user_id,
            tmdb_show_id,
            season_number,
            episode_number,
            episode_name,
            rating,
            notes,
            watched_at
          )
          SELECT
            $1,
            $2,
            payload.season_number,
            payload.episode_number,
            payload.episode_name,
            payload.rating,
            payload.notes,
            COALESCE(NULLIF(payload.watched_at, '')::timestamptz, now())
          FROM payload
          ON CONFLICT(user_id, tmdb_show_id, season_number, episode_number) DO UPDATE SET
            episode_name = excluded.episode_name,
            rating = excluded.rating,
            notes = excluded.notes,
            watched_at = excluded.watched_at
          RETURNING id
        )
        SELECT COUNT(*)::text AS count FROM upserted
        `,
        [userId, body.tmdb_show_id, JSON.stringify(episodes)],
      );

      return NextResponse.json({ count: Number(rows[0]?.count ?? 0) }, { status: 201 });
    } catch (error) {
      console.error("Error logging episodes in bulk:", error);
      return NextResponse.json({ error: "Failed to log episodes" }, { status: 500 });
    }
  }

  if (body.season_number === undefined || body.episode_number === undefined) {
    return NextResponse.json(
      { error: "tmdb_show_id, season_number, and episode_number are required" },
      { status: 400 },
    );
  }

  try {
    await db.query(
      `
      INSERT INTO episode_logs (
        user_id,
        tmdb_show_id,
        season_number,
        episode_number,
        episode_name,
        rating,
        notes,
        watched_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT(user_id, tmdb_show_id, season_number, episode_number) DO UPDATE SET
        episode_name = excluded.episode_name,
        rating = excluded.rating,
        notes = excluded.notes,
        watched_at = excluded.watched_at
      `,
      [
        userId,
        body.tmdb_show_id,
        body.season_number,
        body.episode_number,
        body.episode_name ?? null,
        body.rating ?? null,
        body.notes ?? null,
        body.watched_at ?? new Date().toISOString(),
      ],
    );

    const log = await db.one(
      `
        SELECT *
        FROM episode_logs
        WHERE user_id = $1 AND tmdb_show_id = $2 AND season_number = $3 AND episode_number = $4
      `,
      [userId, body.tmdb_show_id, body.season_number, body.episode_number],
    );

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Error logging episode:", error);
    return NextResponse.json({ error: "Failed to log episode" }, { status: 500 });
  }
}
