import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // ✅ Allow images from your backend uploads directory
    images: {
        remotePatterns: [
            {
                protocol: "http",
                hostname: "localhost",
                port: "10000",
                pathname: "/uploads/**",
            },
            {
                protocol: "https",
                hostname: "*.railway.app",
                pathname: "/uploads/**",
            },
            {
                protocol: "https",
                hostname: "*.render.com",
                pathname: "/uploads/**",
            },
        ],
    },
};

export default nextConfig;