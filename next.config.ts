import type {NextConfig} from 'next';
import CopyPlugin from 'copy-webpack-plugin';
import path from 'path';

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
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, // This is to solve the 'fs' module not found error in sql.js
    };
    
    config.plugins.push(
        new CopyPlugin({
            patterns: [
                {
                    from: path.join(__dirname, 'node_modules/sql.js/dist/sql-wasm.wasm'),
                    to: path.join(__dirname, 'public'),
                },
            ],
        })
    );

    return config;
  }
};

export default nextConfig;
