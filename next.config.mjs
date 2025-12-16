// FILE: next.config.mjs

const isCapacitor = process.env.CAPACITOR === "true";

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },

  // ✅ Only export when building mobile assets
  ...(isCapacitor
    ? {
        output: "export",
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
