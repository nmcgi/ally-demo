// Module Federation (@module-federation/nextjs-mf) only supports the Next.js
// Pages Router, so with the App Router it is opt-in via ENABLE_MODULE_FEDERATION.
// When disabled this app builds and runs standalone (see src/app/page.tsx).
const MF_ENABLED = process.env.ENABLE_MODULE_FEDERATION === 'true';
if (MF_ENABLED) {
  process.env.NEXT_PRIVATE_LOCAL_WEBPACK = 'true';
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, options) {
    if (MF_ENABLED) {
      const { NextFederationPlugin } = require('@module-federation/nextjs-mf');
      config.plugins.push(
        new NextFederationPlugin({
          name: 'admin',
          filename: 'static/chunks/remoteEntry.js',
          exposes: {
            './AdminPortal': './src/components/AdminPortal.tsx',
          },
          shared: {
            react: { singleton: true, requiredVersion: '^18.3.0' },
            'react-dom': { singleton: true, requiredVersion: '^18.3.0' },
            '@tanstack/react-query': { singleton: true, requiredVersion: '^5.62.0' },
          },
          extraOptions: { enableImageLoaderFix: true, enableUrlLoaderFix: true },
        }),
      );
    }
    return config;
  },
};

module.exports = nextConfig;
