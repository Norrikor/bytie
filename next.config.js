const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Saves RAM on small VPS during `next build`; run lint in CI/dev separately if needed.
    ignoreDuringBuilds: true,
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
