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

  // Canonical redirect: non-www → www (server builds only; static export doesn't support redirects)
  ...(!isCapacitor && {
    async redirects() {
      return [
        {
          source: "/:path*",
          has: [{ type: "host", value: "calmtinnitus.com" }],
          destination: "https://www.calmtinnitus.com/:path*",
          permanent: true,
        },
      ];
    },
  }),
};

export default nextConfig;
