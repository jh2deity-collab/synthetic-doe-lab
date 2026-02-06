import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: "/api/:path*",
          destination: "http://127.0.0.1:8000/:path*", // Proxy to Backend (Local only) - Strips /api/
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
