import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained server in .next/standalone for Docker / VPS hosting.
  output: "standalone",
  experimental: {
    serverActions: {
      // Photos are shrunk in the browser first; this leaves room for up to 5 per listing.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
