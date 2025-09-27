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
    // This plugin copies the wasm file to the public directory
    config.plugins.push(
        new CopyPlugin({
            patterns: [
                {
                    from: 'node_modules/sql.js/dist/sql-wasm.wasm',
                    to: path.join(__dirname, 'public'),
                },
            ],
        })
    );

    // This is needed to make sure that the `fs` module is not bundled on the client
    if (!isServer) {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
        };
    }

    return config;
  }
};

export default nextConfig;
