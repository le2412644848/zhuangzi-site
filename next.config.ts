import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // 开发期允许本机各种访问入口（localhost 默认受信；IP / 中文主机名 /
  // 局域网设备否则会被静默拦死水合，页面像坏了一样）
  allowedDevOrigins: [
    "127.0.0.1",
    "192.168.0.100",
    "169.254.187.41",
    "169.254.123.190",
    "江河万里",
    "xn--chqq35ehha232k",
  ],
};

export default nextConfig;
