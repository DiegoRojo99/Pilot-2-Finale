import { prisma } from "@/lib/prisma";

export async function fetchShowCount(): Promise<number> {
  return prisma.show.count();
}

export async function fetchShowIdsPageAfterCursor(cursor: number, batchSize: number): Promise<number[]> {
  const rows = await prisma.show.findMany({
    where: {
      tmdbId: {
        gt: cursor,
      },
    },
    orderBy: {
      tmdbId: "asc",
    },
    take: batchSize,
    select: {
      tmdbId: true,
    },
  });

  return rows.map((row) => row.tmdbId);
}