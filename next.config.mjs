/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  allowedDevOrigins: [
    "192.168.18.6",
    "192.168.18.6:3000",
    "afterglow-monsieur-quarterly.ngrok-free.dev", 
    "*.ngrok-free.dev",                           
    "*.ngrok-free.app",
  ],

  async rewrites() {
    return [
      {
        source: "/__/auth/handler",
        destination: "/api/auth/handler",
      },
      {
        source: "/api/booking-link/:path*",
        destination: "http://127.0.0.1:9000/api/booking-link/:path*",
      },
    ];
  },

  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "products-sale-bucket.s3.ap-southeast-1.amazonaws.com",
        pathname: "/**",
      },
    ],
    unoptimized: true,
  },
};

// Export the Next.js config directly:
export default nextConfig;