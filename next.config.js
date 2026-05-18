/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable SPA export mode (replaces next export)
  // Perfect for Capacitor mobile apps
  output: 'export',

  // Enable trailing slashes for better SPA routing
  trailingSlash: true,

  // Enable React strict mode
  reactStrictMode: true,

  // Disable image optimization for static export and mobile compatibility
  images: {
    unoptimized: true,
  },

  // Disable server-side features for SPA/Capacitor compatibility
  poweredByHeader: false,
  
  // Ensure relative paths for Capacitor mobile apps
  assetPrefix: undefined,
  basePath: '',

  // Ignore ESLint during builds to prevent build failures
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Experimental features for better compatibility
  experimental: {
    esmExternals: "loose",
  },

  // Webpack configuration to handle Node.js polyfills
  webpack: (config, { isServer }) => {
    // Client-side polyfills
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
