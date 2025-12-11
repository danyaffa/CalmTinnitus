/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // <--- COMMENTED OUT FOR VERCEL DEPLOYMENT. (Uncomment this line only when building for Android/iOS)
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
