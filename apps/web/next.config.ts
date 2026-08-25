import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,

  images: {
    remotePatterns: [{ protocol: "https", hostname: "eqr61bekec.ufs.sh" }],
  },
};

export default nextConfig;
