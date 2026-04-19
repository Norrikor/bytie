const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Saves RAM on small VPS during `next build`; run lint in CI/dev separately if needed.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // `next build` runs `tsc` after compile; on 1GB RAM VPS the process is often OOM-killed.
    // Run `npx tsc --noEmit` locally or in GitHub Actions before merge.
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
    }
    return config
  },
}

module.exports = nextConfig
