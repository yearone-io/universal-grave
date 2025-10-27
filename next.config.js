/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    /** Allow images from all domains
     *  @next/image
     */
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Wildcard for all hostnames
        pathname: '**', // Wildcard for all paths
      },
    ],
  },
  // Environment Variables
  env: {
    NEXT_PUBLIC_DEFAULT_NETWORK:
      process.env.NEXT_PUBLIC_DEFAULT_NETWORK || 'mainnet',
  },
  reactStrictMode: false,
  // Webpack Configuration for WalletConnect and other dependencies
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.resolve.fallback = { fs: false, net: false };
    return config;
  },
};

module.exports = nextConfig;
