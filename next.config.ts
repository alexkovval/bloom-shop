import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product photos are hotlinked from Unsplash (see src/lib/productImages.ts)
    // instead of being downloaded into public/images/ — next/image requires
    // remote domains to be explicitly allow-listed.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
