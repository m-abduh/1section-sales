import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pdfkit", "docx"],
  outputFileTracingIncludes: {
    "/api/admin/builder/*/pdf": ["./assets/fonts/**/*"],
  },
  allowedDevOrigins: [
    "1section.com",
    "*.1section.com",
    "*.localhost",
    "lvh.me",
    "*.lvh.me",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.1section.com" },
      { protocol: "https", hostname: "**.paddle.com" },
      { protocol: "https", hostname: "**.paddleusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async rewrites() {
    return [];
  },
};

export default nextConfig;
