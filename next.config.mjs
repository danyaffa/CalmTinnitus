/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',               // <--- ADD THIS (Required for Capacitor)
  images: {
    unoptimized: true,            // <--- ADD THIS (Required if you use <Image> tags)
  },
  reactStrictMode: true,
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
