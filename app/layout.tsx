import type { Metadata } from "next";
import { BottomNav } from "@/components/layout/BottomNav";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pilot 2 Finale",
  description: "Track your TV shows from pilot to finale with a single Next.js app.",
  icons: {
    icon: [
      { url: "/Logo.png", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/Logo.png",
    apple: "/Logo.png",
  },
  manifest: "/manifest.webmanifest",
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
            <div className="mx-auto flex min-h-full w-full flex-1 flex-col bg-slate-900 sm:max-w-3xl xl:max-w-full xl:px-4">
              <div className="flex-1 overflow-hidden pb-[calc(56px+env(safe-area-inset-bottom,0px))]">
                {children}
              </div>
              <BottomNav />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
