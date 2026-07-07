import { NextResponse } from "next/server";
import db from "@/lib/db";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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

  const { id } = await params;
  const result = await db.query("DELETE FROM episode_logs WHERE id = $1 RETURNING id", [Number(id)]);

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Episode log not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
