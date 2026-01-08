/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for API routes
  // Note: Next.js 14 doesn't have a direct body size config here,
  // but this documents the limit and helps with other optimizations
  experimental: {
    // Increase max duration for long-running requests
    serverActions: {
      bodySizeLimit: '10mb', // 10MB limit for server actions
    },
  },
  
  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'theartfulexperience.com',
      },
      {
        protocol: 'https',
        hostname: 'dredev.theartfulexperience.com',
      },
    ],
  },
};

module.exports = nextConfig;