/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // On the client bundle, ignore the Node-only "undici" package
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        undici: false,
      };
    }
    return config;
  },
};

export default nextConfig;

