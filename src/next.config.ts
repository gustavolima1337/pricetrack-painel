
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // This allows cross-origin requests from the web preview development environment.
    allowedDevOrigins: [
      'https://*.cloudworkstations.dev',
      'https://*.firebase.studio',
    ],
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
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'epocacosmeticos.vteximg.com.br',
      },
      {
        protocol: 'https',
        hostname: 'a-static.mlcdn.com.br',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      }
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/price-data',
        destination: 'http://127.0.0.1:8000/api/products/',
      },
      {
        source: '/api/url-data',
        destination: 'http://127.0.0.1:8000/api/urls/',
      },
      {
        source: '/api/urls/update_is_active',
        destination: 'http://127.0.0.1:8000/api/urls/update_is_active',
      },
    ];
  },
};

export default nextConfig;
