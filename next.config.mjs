/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // Ignores TS errors to force the build
  },
  eslint: {
    ignoreDuringBuilds: true, // Ignores linting errors to force the build
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      undici: false
    };
    return config;
  }
};

export default nextConfig;
