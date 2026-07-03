import { NextResponse } from "next/server";
import db from "@/lib/db";
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

  const { searchParams } = new URL(request.url);
  const tmdbShowId = searchParams.get("tmdb_show_id");
  const limit = Number(searchParams.get("limit") ?? "50");
  const offset = Number(searchParams.get("offset") ?? "0");

  if (tmdbShowId) {
    const logs = db
      .prepare(`
        SELECT el.*, us.name as show_name, us.poster_path
        FROM episode_logs el
        JOIN user_shows us ON el.tmdb_show_id = us.tmdb_id
        WHERE el.tmdb_show_id = ?
        ORDER BY el.season_number ASC, el.episode_number ASC
        LIMIT ? OFFSET ?
      `)
      .all(tmdbShowId, limit, offset);

    return NextResponse.json(logs);
  }

  const logs = db
    .prepare(`
      SELECT el.*, us.name as show_name, us.poster_path
      FROM episode_logs el
      JOIN user_shows us ON el.tmdb_show_id = us.tmdb_id
      ORDER BY el.watched_at DESC
      LIMIT ? OFFSET ?
    `)
    .all(limit, offset);

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

  const body = await readJson<EpisodeLogPayload>(request);

  if (!body?.tmdb_show_id || body.season_number === undefined || body.episode_number === undefined) {
    return NextResponse.json(
      { error: "tmdb_show_id, season_number, and episode_number are required" },
      { status: 400 },
    );
  }

  const show = db.prepare("SELECT id FROM user_shows WHERE tmdb_id = ?").get(body.tmdb_show_id);

  if (!show) {
    return NextResponse.json({ error: "Show not in your list. Add it first." }, { status: 404 });
  }

  try {
    const statement = db.prepare(`
      INSERT INTO episode_logs (
        tmdb_show_id,
        season_number,
        episode_number,
        episode_name,
        rating,
        notes,
        watched_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(tmdb_show_id, season_number, episode_number) DO UPDATE SET
        episode_name = excluded.episode_name,
        rating = excluded.rating,
        notes = excluded.notes,
        watched_at = excluded.watched_at
    `);

    statement.run(
      body.tmdb_show_id,
      body.season_number,
      body.episode_number,
      body.episode_name ?? null,
      body.rating ?? null,
      body.notes ?? null,
      body.watched_at ?? new Date().toISOString(),
    );

    const log = db
      .prepare(`
        SELECT *
        FROM episode_logs
        WHERE tmdb_show_id = ? AND season_number = ? AND episode_number = ?
      `)
      .get(body.tmdb_show_id, body.season_number, body.episode_number);

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Error logging episode:", error);
    return NextResponse.json({ error: "Failed to log episode" }, { status: 500 });
  }
}
