/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://nrzgyippztzenoyrtszr.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? "",
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "**.myshopify.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "**.behold.pictures" },
      { protocol: "https", hostname: "feeds.behold.so" },
      { protocol: "https", hostname: "catscandance.com" },
      { protocol: "https", hostname: "**.instagram.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
  webpack(config) {
    // Handle SVG imports via @svgr/webpack
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  async headers() {
    if (process.env.NODE_ENV === "production") return [];
    return [{ source: "/(.*)", headers: [{ key: "Cache-Control", value: "no-store" }] }];
  },
  experimental: {
    workerThreads: false,
    cpus: 2,
  },
};
export default nextConfig;
