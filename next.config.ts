import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
};

module.exports = {
  allowedDevOrigins: [
    '192.168.1.63',
    '192.168.10.112'
  ],
}

export default nextConfig;
