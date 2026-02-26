/** @type {import('next').NextConfig} */
const isCapacitor = process.env.CAPACITOR === "true";

const nextConfig = {
  // Static export only for Capacitor builds; Vercel uses server mode for API routes
  ...(isCapacitor && { output: "export" }),

  // Helps static export routing + Capacitor file:// style paths
  trailingSlash: true,

  // Required because Next <Image> optimization needs a server
  images: { unoptimized: true },

  reactStrictMode: true,
};

export default nextConfig;
