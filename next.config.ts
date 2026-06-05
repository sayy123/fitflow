import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['prettier'],
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
};

export default nextConfig;
