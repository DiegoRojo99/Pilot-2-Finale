import { MetadataRoute } from "next";
import { prisma } from "@/lib/core/prisma";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://pilot-2-finale.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Fetch all shows that users are tracking
    const shows = await prisma.show.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      take: 50000, // Sitemap limit is usually 50,000 URLs
    });

    // Map shows to sitemap entries
    const showEntries: MetadataRoute.Sitemap = shows.map((show) => ({
      url: `${baseUrl}/show/${show.tmdbId}`,
      lastModified: show.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/watching`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/search`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/profile`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/history`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/achievements`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
      {
        url: `${baseUrl}/stats`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
      {
        url: `${baseUrl}/privacy`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      },
    ];

    return [...staticPages, ...showEntries];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return static pages only if database query fails
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/watching`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/search`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
    ];
  }
}
