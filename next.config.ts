import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-01f09c37e5784a26a410dffc4b7022ed.r2.dev',
        pathname: '/images/**',
      },
    ],
  },
};

export default nextConfig;
