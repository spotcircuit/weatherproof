/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Improve hot reload performance
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Better source maps for development
      config.devtool = 'eval-source-map'
      
      // Webpack watching options for Windows/WSL
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay rebuild after change detection
        ignored: ['**/node_modules', '**/.git', '**/.next']
      }
    }
    
    return config
  },
  
  // Experimental features for better DX
  experimental: {
    // Faster builds
    webpackBuildWorker: true,
    // Better error handling
    clientRouterFilter: true,
    clientRouterFilterRedirects: true,
    // Missing suspense configuration
    missingSuspenseWithCSRBailout: false,
  },
  
  // Handle Windows path issues
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5,
  },
}

module.exports = nextConfig