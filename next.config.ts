import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.digitaloceanspaces.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
    webpackMemoryOptimizations: true,
  },
};

export default nextConfig;
