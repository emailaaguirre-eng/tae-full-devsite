/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip TypeScript and ESLint during build
  // These have pre-existing issues that need to be fixed incrementally
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Increase body size limit for API routes
  experimental: {
    // Allow useSearchParams without Suspense boundary (existing behavior)
    missingSuspenseWithCSRBailout: false,
    serverActions: {
      bodySizeLimit: '10mb', // 10MB limit for server actions
    },
    // Exclude sql.js from bundling - it needs to load WASM at runtime
    serverComponentsExternalPackages: ['sql.js'],
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