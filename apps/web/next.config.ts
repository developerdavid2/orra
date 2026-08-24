import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  output: "standalone",
  experimental: {
    // Router Cache: keep visited dynamic pages client-side for 120s so
    // navigating back to a recently visited route is instant (no loading.tsx
    // re-flash). Default is 0s, which discards every dynamic payload.
    staleTimes: { dynamic: 120 },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "eqr61bekec.ufs.sh",
      },
    ],
  },
};

export default nextConfig;
