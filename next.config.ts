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
  // Other Next.js configurations...
};

export default nextConfig;