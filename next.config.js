/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root to THIS folder to avoid the multiple-lockfiles warning
  turbopack: {
    root: __dirname,
  },

  // Prevent mqtt's Node.js-only modules from being bundled into the browser build
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
