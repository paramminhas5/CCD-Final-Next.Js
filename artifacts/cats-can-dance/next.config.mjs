/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? process.env.CLERK_PUBLISHABLE_KEY ?? "",
    NEXT_PUBLIC_CLERK_PROXY_URL: process.env.CLERK_PROXY_URL ?? "",
    NEXT_PUBLIC_SUPABASE_URL: "https://nrzgyippztzenoyrtszr.supabase.co",
    // anon key is safe to expose - RLS protects data
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? "",
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    if (process.env.NODE_ENV === "production") return [];
    return [{ source: "/(.*)", headers: [{ key: "Cache-Control", value: "no-store" }] }];
  },
};
export default nextConfig;
