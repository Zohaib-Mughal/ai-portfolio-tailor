import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    resolveAlias: {
      "ai/react": "@ai-sdk/react",
    },
  },
};

export default nextConfig;
