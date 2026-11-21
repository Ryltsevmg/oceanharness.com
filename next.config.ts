import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

// When set (Railway), reuse the published Pages build id so the HTML is byte-identical.
if (process.env.NEXT_BUILD_ID) {
  config.generateBuildId = async () => process.env.NEXT_BUILD_ID as string;
}

export default config;
