import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '60mb',
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      // For self-hosted images
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9002',
      },
      {
        protocol: 'http',
        hostname: '0.0.0.0',
        port: '9002',
      },
      {
        protocol: 'https',
        hostname: '**.cloudworkstations.dev',
      },
    ],
  },
};

export default nextConfig;
