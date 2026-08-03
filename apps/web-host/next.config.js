// Module Federation (@module-federation/nextjs-mf) only supports the Next.js
// Pages Router, so with the App Router it is opt-in via ENABLE_MODULE_FEDERATION.
// When enabled it also requires the host webpack instance (NEXT_PRIVATE_LOCAL_WEBPACK).
const path = require('path');

const MF_ENABLED = process.env.ENABLE_MODULE_FEDERATION === 'true';
if (MF_ENABLED) {
  process.env.NEXT_PRIVATE_LOCAL_WEBPACK = 'true';
}

// Exact remote specifiers the host consumes (see src/types/remote-modules.d.ts),
// mapped to the component each remote exposes in its own next.config.js.
const REMOTE_MODULES = {
  'accounts/AccountsDashboard': '../web-accounts/src/components/AccountsDashboard.tsx',
  'loans/LoanApplication': '../web-loans/src/components/LoanApplication.tsx',
  'loans/LoanStatus': '../web-loans/src/components/LoanStatusEntry.tsx',
  'admin/AdminPortal': '../web-admin/src/components/AdminPortal.tsx',
};

// Roots whose sources own their own `@/*` alias. Every frontend maps `@/*` to
// its own src/, so when the host compiles a remote's source directly the alias
// has to be resolved against the *importing file*, not the host.
const REMOTE_SRC_ROOTS = ['web-accounts', 'web-loans', 'web-admin'].map((app) =>
  path.resolve(__dirname, '..', app, 'src'),
);

/**
 * Rewrites `@/x` to `<owning remote>/src/x` when the importer lives under one of
 * the remote source roots. Host files are left alone, so Next's own `@/*` alias
 * still wins for everything in this app.
 */
class RemoteAliasResolverPlugin {
  apply(resolver) {
    const target = resolver.ensureHook('resolve');
    resolver
      .getHook('described-resolve')
      .tapAsync('RemoteAliasResolverPlugin', (request, resolveContext, callback) => {
        const specifier = request.request;
        if (!specifier || !specifier.startsWith('@/')) return callback();

        const issuer = request.context && request.context.issuer;
        if (!issuer) return callback();

        const root = REMOTE_SRC_ROOTS.find((r) => issuer.startsWith(r + path.sep));
        if (!root) return callback();

        const rewritten = { ...request, request: path.join(root, specifier.slice(2)) };
        resolver.doResolve(target, rewritten, null, resolveContext, callback);
      });
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets the host compile remote component sources that live outside its root.
  experimental: { externalDir: true },
  webpack(config, options) {
    if (MF_ENABLED) {
      const { NextFederationPlugin } = require('@module-federation/nextjs-mf');
      config.plugins.push(
        new NextFederationPlugin({
          name: 'host',
          filename: 'static/chunks/remoteEntry.js',
          remotes: {
            accounts: `accounts@${process.env.NEXT_PUBLIC_ACCOUNTS_URL ?? 'http://localhost:3004'}/_next/static/chunks/remoteEntry.js`,
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
      // Standalone build: compile each remote's exposed component straight from
      // its workspace source. nextjs-mf refuses to run against the App Router
      // ("App Directory is not supported by nextjs-mf"), so this is what makes
      // the modules render locally — one origin, one dev server, shared token.
      config.resolve.alias = {
        ...config.resolve.alias,
        ...Object.fromEntries(
          Object.entries(REMOTE_MODULES).map(([specifier, target]) => [
            `${specifier}$`,
            path.resolve(__dirname, target),
          ]),
        ),
      };
      config.resolve.plugins = [...(config.resolve.plugins ?? []), new RemoteAliasResolverPlugin()];
    }

    return config;
  },
};

module.exports = nextConfig;
