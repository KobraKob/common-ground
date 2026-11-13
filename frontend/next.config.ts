import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack(config) {
    const currentIgnored = config.watchOptions?.ignored;
    const ignored = Array.isArray(currentIgnored)
      ? currentIgnored
      : currentIgnored
        ? [currentIgnored]
        : [];
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        ...ignored,
        /(^|[\\/])node_modules([\\/]|$)/,
        /^C:[\\/]DumpStack\\.log\\.tmp$/i,
        /^C:[\\/]swapfile\\.sys$/i,
        /^C:[\\/]pagefile\\.sys$/i,
      ],
    };
    return config;
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'commonground.in',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@astryxdesign/core'],
  },
};

export default nextConfig;
