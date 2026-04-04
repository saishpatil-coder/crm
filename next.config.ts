import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import crypto from "crypto";

// This generates a unique ID every time you build, forcing the phone to download the newest offline page!
const revision = crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // This explicitly downloads your offline page to the phone!
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
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
  compiler: {
    // Keeps your terminal and production console clean
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
};

export default withSerwist(nextConfig);
