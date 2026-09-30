import type { Metadata } from "next";
import { cache } from "react";
import type { TMDBShow } from "@/types";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://pilot-2-finale.vercel.app";

// Cache the fetch to avoid duplicate requests during metadata generation and rendering
const getShowData = cache(async (id: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || baseUrl}/api/shows/${id}`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    if (!response.ok) return null;
    return response.json() as Promise<TMDBShow>;
  } catch (error) {
    console.error("Error fetching show metadata:", error);
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const show = await getShowData(id);

  if (!show) {
    return {
      title: "Show Not Found | Pilot 2 Finale",
      description: "This show could not be found.",
    };
  }

  const description =
    show.overview?.substring(0, 160) ||
    `Watch ${show.name} on Pilot 2 Finale and track your episodes.`;
  const posterUrl = show.poster_path
    ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
    : `${baseUrl}/Logo.png`;
  const backdropUrl = show.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}`
    : posterUrl;

  const genreString = show.genres?.map((g) => g.name).join(", ") || "Television";

  return {
    title: `${show.name} | Pilot 2 Finale`,
    description,
    keywords: [
      show.name,
      "TV show",
      "episode tracker",
      "watchlist",
      ...(show.genres?.map((g) => g.name) || []),
    ],
    authors: [{ name: "Pilot 2 Finale" }],
    creator: "Pilot 2 Finale",
    category: "Entertainment",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `${baseUrl}/show/${id}`,
      siteName: "Pilot 2 Finale",
      title: `${show.name} | Pilot 2 Finale`,
      description,
      images: [
        {
          url: posterUrl,
          width: 500,
          height: 750,
          alt: `${show.name} Poster`,
        },
        {
          url: backdropUrl,
          width: 1280,
          height: 720,
          alt: `${show.name} Backdrop`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${show.name} | Pilot 2 Finale`,
      description,
      creator: "@Pilot2Finale",
      images: [posterUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
  };
}

export default async function ShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Pre-fetch the show data for the client component
  const { id } = await params;
  await getShowData(id);

  // Import and render the client component
  const { default: ShowDetailPage } = await import(
    "@/components/pages/ShowDetailPage"
  );
  return <ShowDetailPage />;
}
