import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
};

module.exports = {
  allowedDevOrigins: [
    '192.168.1.63',
    '192.168.10.112'
  ],
}

export default nextConfig;
