import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  allowedDevOrigins: [
    "192.168.1.63", 
    "192.168.10.112", 
    "192.168.10.111",
    "192.168.1.63"
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
} as NextConfig & {
  crons?: Array<{
    path: string;
    schedule: string;
  }>;
};

(nextConfig as any).crons = [
  {
    path: "/api/admin/update-next-episodes",
    schedule: "0 2 * * *", // Daily at 2 AM UTC
  },
];

export default nextConfig;
