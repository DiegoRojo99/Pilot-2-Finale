import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { readJson } from "@/lib/http";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

type EpisodeLogPayload = {
  tmdb_show_id?: number;
  tmdb_episode_id?: number | null;
  season_number?: number;
  episode_number?: number;
  episode_name?: string | null;
  rating?: number | null;
  notes?: string | null;
  watched_at?: string | null;
  episodes?: Array<{
    tmdb_episode_id?: number | null;
    season_number?: number;
    episode_number?: number;
    episode_name?: string | null;
    rating?: number | null;
    notes?: string | null;
    watched_at?: string | null;
  }>;
};

function normalizeRating(value: unknown): number | null | "invalid" {
  if (value === undefined || value === null || value === "") return null;

  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10) return "invalid";

  return parsed;
}

const EPISODE_LOG_SELECT = `
  SELECT
    we.id,
    e.id AS episode_id,
    e.tmdb_episode_id,
    e.tmdb_show_id,
    e.season_number,
    e.episode_number,
    e.name AS episode_name,
    we.watched_at,
    we.created_at,
    we.updated_at,
    we.rating,
    we.notes,
    s.name AS show_name,
    s.poster_path
  FROM watch_entries we
  JOIN episodes e ON e.id = we.episode_id
  JOIN shows s ON s.tmdb_id = e.tmdb_show_id
`;

const LATEST_EPISODE_LOG_SELECT = `
  SELECT DISTINCT ON (we.episode_id)
    we.id,
    e.id AS episode_id,
    e.tmdb_episode_id,
    e.tmdb_show_id,
    e.season_number,
    e.episode_number,
    e.name AS episode_name,
    we.watched_at,
    we.created_at,
    we.updated_at,
    we.rating,
    we.notes,
    s.name AS show_name,
    s.poster_path
  FROM watch_entries we
  JOIN episodes e ON e.id = we.episode_id
  JOIN shows s ON s.tmdb_id = e.tmdb_show_id
`;

async function ensureEpisodeRecord(input: {
  tmdbShowId: number;
  tmdbEpisodeId?: number | null;
  seasonNumber: number;
  episodeNumber: number;
  episodeName?: string | null;
}) {
  const { rows } = await db.query<{ id: number }>(
    `
    INSERT INTO episodes (
      tmdb_episode_id,
      tmdb_show_id,
      season_number,
      episode_number,
      name
    )
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (tmdb_show_id, season_number, episode_number) DO UPDATE SET
      tmdb_episode_id = COALESCE(excluded.tmdb_episode_id, episodes.tmdb_episode_id),
      name = COALESCE(excluded.name, episodes.name),
      updated_at = now()
    RETURNING id
    `,
    [
      input.tmdbEpisodeId ?? null,
      input.tmdbShowId,
      input.seasonNumber,
      input.episodeNumber,
      input.episodeName ?? null,
    ],
  );

  return rows[0]?.id;
}

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
  const withWatchDate = ["1", "true"].includes((searchParams.get("with_watch_date") ?? "").toLowerCase());
  const limit = Number(searchParams.get("limit") ?? "50");
  const offset = Number(searchParams.get("offset") ?? "0");

  if (tmdbShowId) {
    const { rows: logs } = await db.query(
      `
        SELECT *
        FROM (
          ${LATEST_EPISODE_LOG_SELECT}
          WHERE we.user_id = $1 AND e.tmdb_show_id = $2 ${withWatchDate ? "AND we.watched_at IS NOT NULL" : ""}
          ORDER BY we.episode_id, we.watched_at DESC NULLS LAST, we.created_at DESC, we.id DESC
        ) latest
        ORDER BY latest.season_number ASC, latest.episode_number ASC
        LIMIT $3 OFFSET $4
      `,
      [userId, Number(tmdbShowId), limit, offset],
    );

    return NextResponse.json(logs);
  }

  const { rows: logs } = await db.query(
    `
      ${EPISODE_LOG_SELECT}
      WHERE we.user_id = $1 ${withWatchDate ? "AND we.watched_at IS NOT NULL" : ""}
      ORDER BY we.watched_at DESC NULLS LAST, we.created_at DESC, we.id DESC
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

    const normalizedEpisodes = episodes.map((episode) => {
      const normalizedRating = normalizeRating(episode.rating);
      return {
        ...episode,
        rating: normalizedRating === "invalid" ? episode.rating : normalizedRating,
      };
    });

    const hasInvalidRating = normalizedEpisodes.some((episode) => normalizeRating(episode.rating) === "invalid");

    if (hasInvalidRating) {
      return NextResponse.json({ error: "rating must be between 0 and 10" }, { status: 400 });
    }

    try {
      const { rows } = await db.query<{ count: string }>(
        `
        WITH payload AS (
          SELECT *
          FROM jsonb_to_recordset($3::jsonb) AS episode(
            tmdb_episode_id INTEGER,
            season_number INTEGER,
            episode_number INTEGER,
            episode_name TEXT,
            rating DOUBLE PRECISION,
            notes TEXT,
            watched_at TEXT
          )
        ), upserted_episodes AS (
          INSERT INTO episodes (
            tmdb_episode_id,
            tmdb_show_id,
            season_number,
            episode_number,
            name
          )
          SELECT
            payload.tmdb_episode_id,
            $2,
            payload.season_number,
            payload.episode_number,
            payload.episode_name
          FROM payload
          ON CONFLICT (tmdb_show_id, season_number, episode_number) DO UPDATE SET
            tmdb_episode_id = COALESCE(excluded.tmdb_episode_id, episodes.tmdb_episode_id),
            name = COALESCE(excluded.name, episodes.name),
            updated_at = now()
          RETURNING id, season_number, episode_number
        ), inserted_entries AS (
          INSERT INTO watch_entries (
            user_id,
            episode_id,
            rating,
            notes,
            watched_at
          )
          SELECT
            $1,
            ue.id,
            payload.rating,
            payload.notes,
            NULLIF(payload.watched_at, '')::timestamptz
          FROM payload
          JOIN upserted_episodes ue
            ON ue.season_number = payload.season_number
           AND ue.episode_number = payload.episode_number
          RETURNING id
        )
        SELECT COUNT(*)::text AS count FROM inserted_entries
        `,
        [userId, body.tmdb_show_id, JSON.stringify(normalizedEpisodes)],
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

  const normalizedRating = normalizeRating(body.rating);
  if (normalizedRating === "invalid") {
    return NextResponse.json({ error: "rating must be between 0 and 10" }, { status: 400 });
  }

  try {
    const episodeId = await ensureEpisodeRecord({
      tmdbShowId: body.tmdb_show_id,
      tmdbEpisodeId: body.tmdb_episode_id,
      seasonNumber: body.season_number,
      episodeNumber: body.episode_number,
      episodeName: body.episode_name ?? null,
    });

    if (!episodeId) {
      return NextResponse.json({ error: "Failed to resolve episode record" }, { status: 500 });
    }

    const inserted = await db.one<{ id: number }>(
      `
      INSERT INTO watch_entries (
        user_id,
        episode_id,
        rating,
        notes,
        watched_at
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [
        userId,
        episodeId,
        normalizedRating,
        body.notes ?? null,
        body.watched_at ?? null,
      ],
    );

    const log = await db.one(
      `
        ${EPISODE_LOG_SELECT}
        WHERE we.user_id = $1 AND we.id = $2
      `,
      [userId, inserted?.id],
    );

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Error logging episode:", error);
    return NextResponse.json({ error: "Failed to log episode" }, { status: 500 });
  }
}
