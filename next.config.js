/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'onlyonetoday.com'],
  },
  webpack: (config, { isServer }) => {
    // Handle Transformers.js model files
    config.resolve.alias = {
      ...config.resolve.alias,
      'sharp$': false,
      'onnxruntime-node$': false,
    }
    
    return config
  },
  experimental: {
    serverActions: {
      enabled: true,
    },
    serverComponentsExternalPackages: ['@xenova/transformers', 'natural'],
  },
}

module.exports = nextConfig

