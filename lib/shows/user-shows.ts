import type { ShowStatus, UserShow } from "@/types";
import { mapUserShow } from "@/lib/mappers/user-show";
import { prisma } from "@/lib/core";

type MapOptions = {
  preferUserNameWhenShowIsPlaceholder?: boolean;
};

export async function fetchUserShowsByUserId(
  userId: string,
  status?: ShowStatus,
  options?: MapOptions,
): Promise<UserShow[]> {
  const rows = await prisma.userShow.findMany({
    where: {
      userId,
      ...(status ? { status } : {}),
    },
    include: {
      show: true,
      nextEpisodeToWatch: {
        select: {
          id: true,
          tmdbEpisodeId: true,
          seasonNumber: true,
          episodeNumber: true,
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return rows.map((row) => mapUserShow(row, options));
}

export async function fetchUserShowByTmdbId(
  userId: string,
  tmdbId: number,
  options?: MapOptions,
): Promise<UserShow | null> {
  const row = await prisma.userShow.findUnique({
    where: {
      userId_tmdbId: {
        userId,
        tmdbId,
      },
    },
    include: {
      show: true,
      nextEpisodeToWatch: {
        select: {
          id: true,
          tmdbEpisodeId: true,
          seasonNumber: true,
          episodeNumber: true,
          name: true,
        },
      },
    },
  });

  if (!row) return null;
  return mapUserShow(row, options);
}