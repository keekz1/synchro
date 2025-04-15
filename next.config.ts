// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**", // Allows all paths
      },
    ],
    // domains: ["firebasestorage.googleapis.com"], // Alternative approach
  },
// Force redirect non-www to www
async redirects() {
  return [
    {
      source: 'https://wesynchro.com/:path*',
      destination: 'https://www.wesynchro.com/:path*',
      permanent: true,
    },
  ]
}
};

export default nextConfig;