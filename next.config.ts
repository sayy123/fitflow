import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['prettier'],
  serverActions: {
    bodySizeLimit: '4mb',
  },
};

export default nextConfig;
