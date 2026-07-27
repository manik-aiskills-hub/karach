/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@kharch/app-logic"],
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
  },
};
module.exports = nextConfig;
