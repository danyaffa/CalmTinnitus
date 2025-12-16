/** @type {import('next').NextConfig} */
const isCapacitor = process.env.CAPACITOR === "true";

const nextConfig = {
  output: isCapacitor ? "export" : undefined,
  assetPrefix: isCapacitor ? "./" : undefined,
  trailingSlash: isCapacitor ? true : false,
  images: { unoptimized: true },
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      undici: false,
    };
    return config;
  },
};

export default nextConfig;
