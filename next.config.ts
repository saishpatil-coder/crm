import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  // Where you will write your service worker logic
  swSrc: "app/sw.ts",
  // Where Next.js will output the compiled worker for the browser
  swDest: "public/sw.js",
  // Disable in development so it doesn't cache your hot-reloads
  // disable: process.env.NODE_ENV === "development",
  reloadOnOnline: false, // Prevents the app from randomly refreshing when internet comes back
});
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  turbopack: {},
};

export default withSerwist(nextConfig);
