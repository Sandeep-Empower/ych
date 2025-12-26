/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable static optimization for better performance
    output: 'standalone',
    
    // Configure image domains for external images
    images: {
      remotePatterns: [
        {
          protocol: 'http',
          hostname: 'localhost',
        },
        {
        protocol: 'https',
        hostname: 'assets-adds-ai.lon1.cdn.digitaloceanspaces.com',
        pathname: '/**',
        search: '',
        },
        {
          protocol: 'https',
          hostname: 'dummyimage.com',
          pathname: '/**',
          search: '',
        }
      ],
    },
  
    // Configure headers for security
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
          ],
        },
      ]
    },
  }
  
  module.exports = nextConfig 