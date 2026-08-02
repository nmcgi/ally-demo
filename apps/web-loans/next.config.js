const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, options) {
    config.plugins.push(
      new NextFederationPlugin({
        name: 'loans',
        filename: 'static/chunks/remoteEntry.js',
        exposes: {
          './LoanApplication': './src/components/LoanApplication.tsx',
          './LoanStatus': './src/components/LoanStatusEntry.tsx',
        },
        shared: {
          react: { singleton: true, requiredVersion: '^18.3.0' },
          'react-dom': { singleton: true, requiredVersion: '^18.3.0' },
          '@tanstack/react-query': { singleton: true, requiredVersion: '^5.62.0' },
        },
        extraOptions: { enableImageLoaderFix: true, enableUrlLoaderFix: true },
      }),
    );
    return config;
  },
};

module.exports = nextConfig;
