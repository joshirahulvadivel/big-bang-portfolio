import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile in $HOME is not picked up.
  turbopack: { root: __dirname },
  // Images are pre-sized WebP and JPEG files; Workers has no built-in Next.js image optimiser.
  images: { unoptimized: true },
};

export default nextConfig;
