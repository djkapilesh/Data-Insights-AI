import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Turbopack specific configuration
  turbo: {
    resolveAlias: {
      // Turbopack needs this to resolve sql.js
      'sql.js': 'sql.js/dist/sql-wasm.js',
    },
    resolveExtensions: [
      '.mdx',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.mjs',
      '.json',
    ],
  },
  webpack: (config, { isServer }) => {
    // For sql.js
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false, "path": false };
    if (!isServer) {
        config.output.publicPath = '/_next/';
    }
    return config;
  },
};

export default nextConfig;
