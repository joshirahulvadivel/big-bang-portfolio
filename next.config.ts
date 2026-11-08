import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile in $HOME is not picked up.
  turbopack: { root: __dirname },
};

export default nextConfig;
