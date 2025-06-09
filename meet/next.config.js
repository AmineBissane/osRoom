/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  images: {
    formats: ['image/webp'],
  },
  allowedDevOrigins: ['meettest.duckdns.org'],
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Important: return the modified config
    config.module.rules.push({
      test: /\.mjs$/,
      enforce: 'pre',
      use: ['source-map-loader'],
    });
    
    // Ignore source map errors from @mediapipe
    config.ignoreWarnings = [
      { module: /@mediapipe\/tasks-vision/ },
    ];

    return config;
  },
};

module.exports = nextConfig;
