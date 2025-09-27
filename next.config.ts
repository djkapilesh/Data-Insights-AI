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
  webpack: (config, {isServer}) => {
    // Necessary to make sql.js work with Next.js
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'sql.js': path.resolve(
          __dirname,
          'node_modules/sql.js/dist/sql-wasm-browser.js'
        ),
      };
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: 'node_modules/sql.js/dist/sql-wasm-browser.wasm',
              to: 'static/chunks/sql-wasm-browser.wasm',
            },
          ],
        })
      );
    }

    return config;
  },
};

export default nextConfig;
