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
  },
};

// Redirects must be exported as a top-level async function
export async function redirects() {
  return [
    {
      source: "/",
      destination: "/profile",
      permanent: true,
    },
  ];
}

export default nextConfig;
