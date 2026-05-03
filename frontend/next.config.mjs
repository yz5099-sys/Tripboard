/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: []
  },
  async rewrites() {
    if (process.env.NODE_ENV !== "development" || process.env.NEXT_PUBLIC_API_BASE_URL) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/:path*"
      }
    ];
  }
};

export default nextConfig;
