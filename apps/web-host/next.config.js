// Module Federation (@module-federation/nextjs-mf) only supports the Next.js
// Pages Router, so with the App Router it is opt-in via ENABLE_MODULE_FEDERATION.
// When enabled it also requires the host webpack instance (NEXT_PRIVATE_LOCAL_WEBPACK).
const path = require('path');

const MF_ENABLED = process.env.ENABLE_MODULE_FEDERATION === 'true';
if (MF_ENABLED) {
  process.env.NEXT_PRIVATE_LOCAL_WEBPACK = 'true';
}

// Exact remote specifiers the host consumes (see src/types/remote-modules.d.ts).
const REMOTE_SPECIFIERS = [
  'accounts/AccountsDashboard',
  'loans/LoanApplication',
  'loans/LoanStatus',
  'admin/AdminPortal',
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, options) {
    if (MF_ENABLED) {
      const { NextFederationPlugin } = require('@module-federation/nextjs-mf');
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
    } else {
      // Standalone build: resolve the remote specifiers to a local stub so the
      // host compiles without the remotes. Consuming pages catch the rejected
      // import and render their "remote unavailable" fallback.
      const stub = path.resolve(__dirname, 'src/remote-stub.js');
      config.resolve.alias = {
        ...config.resolve.alias,
        ...Object.fromEntries(REMOTE_SPECIFIERS.map((s) => [`${s}$`, stub])),
      };
    }

    return config;
  },
};

module.exports = nextConfig;
