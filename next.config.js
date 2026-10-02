/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Enables React Strict Mode for catching subtle bugs
  reactStrictMode: true,
  // Experimental features for Next.js 14+
  experimental: {
    // Server Actions are stable in Next.js 14 — no flag needed
  },
};

module.exports = nextConfig;
