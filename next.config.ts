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
    unoptimized: true,
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
      {
        protocol: 'https',
        hostname: 'amazoprint.in',
      },
      {
        protocol: 'https',
        hostname: 'www.amazoprint.in',
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
  // Proxy /uploads/* to amazoprint.in when the file is not found locally.
  // ONLY active in development so local dev can see production images without looping in prod.
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') {
      return [];
    }
    return {
      // These rewrites are tried AFTER checking the filesystem (public/) and before 404.
      fallback: [
        {
          source: '/uploads/:path*',
          destination: 'https://amazoprint.in/uploads/:path*',
        },
      ],
    };
  },
};

export default nextConfig;
