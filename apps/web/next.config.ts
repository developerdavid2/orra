import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    staleTimes: { dynamic: 120 },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "eqr61bekec.ufs.sh" }],
  },
};

export default nextConfig;
