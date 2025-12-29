/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Exclude the functions directory from compilation
    config.externals = [...(config.externals || []), 'firebase-functions'];
    return config;
  }
};

export default nextConfig;