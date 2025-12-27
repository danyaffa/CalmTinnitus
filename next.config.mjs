/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Required for Next 14 static export (replaces `next export`)
  output: "export",

  // ✅ Helps static export routing + Capacitor file:// style paths
  trailingSlash: true,

  // ✅ Required because Next <Image> optimization needs a server
  images: { unoptimized: true },

  // (Optional but fine)
  reactStrictMode: true,
};

export default nextConfig;
