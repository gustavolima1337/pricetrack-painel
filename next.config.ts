
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
      },
      {
        protocol: 'https',
        hostname: 'http2.mlstatic.com',
      }
    ],
  },
  async rewrites() {
    const apiBase = process.env.API_BASE_URL || 'https://pricetrack-api.onrender.com';
    return [
      {
        source: '/api/price-data',
        destination: `${apiBase}/api/products/`,
      },
      {
        source: '/api/url-data',
        destination: `${apiBase}/api/urls/`,
      },
      {
        source: '/api/urls/update_is_active',
        destination: `${apiBase}/api/urls/update_is_active`,
      },
    ];
  },
};

export default nextConfig;
