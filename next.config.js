/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["pg"],
  async rewrites() {
    return [
      { source: "/uploads/:path*", destination: "/api/uploads/:path*" },
    ];
  },
};

module.exports = nextConfig;
