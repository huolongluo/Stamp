import path from "node:path";
import type { NextConfig } from "next";

const pages = process.env.PAGES === "1";
const basePath = pages ? "/Stamp" : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: path.join(import.meta.dirname),
  },
  ...(pages
    ? {
        output: "export" as const,
        trailingSlash: true,
        basePath,
      }
    : {}),
};

export default nextConfig;
