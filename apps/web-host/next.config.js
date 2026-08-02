const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, options) {
    const { isServer } = options;

    config.plugins.push(
      new NextFederationPlugin({
        name: 'host',
        filename: 'static/chunks/remoteEntry.js',
        remotes: {
          accounts: `accounts@${process.env.NEXT_PUBLIC_ACCOUNTS_URL ?? 'http://localhost:3001'}/_next/static/chunks/remoteEntry.js`,
          loans: `loans@${process.env.NEXT_PUBLIC_LOANS_URL ?? 'http://localhost:3002'}/_next/static/chunks/remoteEntry.js`,
          admin: `admin@${process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3003'}/_next/static/chunks/remoteEntry.js`,
        },
        shared: {
          react: { singleton: true, requiredVersion: '^18.3.0' },
          'react-dom': { singleton: true, requiredVersion: '^18.3.0' },
          'react-redux': { singleton: true, requiredVersion: '^9.1.0' },
          '@reduxjs/toolkit': { singleton: true, requiredVersion: '^2.3.0' },
          '@tanstack/react-query': { singleton: true, requiredVersion: '^5.62.0' },
        },
        extraOptions: {
          exposePages: false,
          enableImageLoaderFix: true,
          enableUrlLoaderFix: true,
          skipSharingNextInternals: false,
        },
      }),
    );

    return config;
  },
};

module.exports = nextConfig;
