import type { Metadata } from "next";
import { BottomNav } from "@/components/layout/BottomNav";
import { Providers } from "@/components/Providers";
import { VercelAnalytics } from "@/components/analytics/VercelAnalytics";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://pilot-2-finale.vercel.app";

export const metadata: Metadata = {
  title: "Pilot 2 Finale - Track TV Shows from Pilot to Finale",
  description: "Track your favorite TV shows from pilot to finale. Keep up with episodes, manage your watchlist, and never miss a show you love.",
  keywords: ["TV shows", "episode tracker", "watchlist", "television", "shows"],
  authors: [{ name: "Pilot 2 Finale" }],
  creator: "Pilot 2 Finale",
  publisher: "Pilot 2 Finale",
  applicationName: "Pilot 2 Finale",
  category: "Entertainment",
  icons: {
    icon: [
      { url: "/Logo.png", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/Logo.png",
    apple: "/Logo.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Pilot 2 Finale",
    title: "Pilot 2 Finale - Track TV Shows from Pilot to Finale",
    description: "Track your favorite TV shows from pilot to finale. Keep up with episodes, manage your watchlist, and never miss a show you love.",
    images: [
      {
        url: `${baseUrl}/Logo.png`,
        width: 1200,
        height: 630,
        alt: "Pilot 2 Finale Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pilot 2 Finale - Track TV Shows from Pilot to Finale",
    description: "Track your favorite TV shows from pilot to finale.",
    creator: "@Pilot2Finale",
    images: [`${baseUrl}/Logo.png`],
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
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <Providers>
          <div className="flex min-h-full flex-col bg-slate-950">
            <div className="mx-auto flex min-h-full w-full flex-1 flex-col bg-slate-900 xl:max-w-full xl:px-4">
              <div className="flex-1 overflow-hidden pb-[calc(56px+env(safe-area-inset-bottom,0px))]">
                {children}
              </div>
              <BottomNav />
            </div>
          </div>
          <VercelAnalytics />
        </Providers>
      </body>
    </html>
  );
}
