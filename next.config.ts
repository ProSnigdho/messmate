import type { NextConfig } from "next";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
} as NextConfig; // Type assertion use koro

export default nextConfig;
