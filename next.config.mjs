/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  /*
   * The Studio API. Every `/api/*` request the browser makes is proxied to it on the server side, so
   * the app is same-origin with its backend: no CORS, and the build's SSE stream is a plain
   * same-origin EventSource. Point STUDIO_API_URL elsewhere to run against a remote API.
   */
  async rewrites() {
    const api = (process.env.STUDIO_API_URL ?? 'http://127.0.0.1:4310').replace(/\/$/, '');
    return [{ source: '/api/:path*', destination: `${api}/api/:path*` }];
  },

  experimental: {
    /*
     * The dev proxy behind `rewrites()` drops a request after 30 s by default. Design and
     * simulation calls run a model and hold the request open for longer than that; the backend
     * finishes fine, and the browser sees "socket hang up" instead. Ten minutes covers a build.
     */
    proxyTimeout: 600_000,

    // These are barrel files: a single `import { X } from 'lucide-react'` pulls
    // the whole index in dev unless Next rewrites it to a deep import. Matters a
    // lot for per-route dev compile time.
    optimizePackageImports: ['lucide-react', '@xyflow/react', '@tanstack/react-query'],

    turbo: {
      /*
       * Turbopack's resolveAlias matches EXACT specifiers — there is no prefix
       * matching — so every subpath has to be listed. These are optional
       * micropayment SDKs reached through
       *   RainbowKit -> wagmi connectors -> Coinbase baseAccount
       *   -> @base-org/account -> @coinbase/cdp-sdk -> @x402/*
       * ContextLock never executes a payment path, so they resolve to empty
       * rather than being installed.
       */
      resolveAlias: {
        '@react-native-async-storage/async-storage': './lib/studio/empty-module.ts',
        'pino-pretty': './lib/studio/empty-module.ts',
        '@x402/core': './lib/studio/empty-module.ts',
        '@x402/core/client': './lib/studio/empty-module.ts',
        '@x402/core/server': './lib/studio/empty-module.ts',
        '@x402/core/types': './lib/studio/empty-module.ts',
        '@x402/evm': './lib/studio/empty-module.ts',
        '@x402/evm/batch-settlement/client': './lib/studio/empty-module.ts',
        '@x402/evm/exact/client': './lib/studio/empty-module.ts',
        '@x402/evm/exact/server': './lib/studio/empty-module.ts',
        '@x402/evm/exact/v1/client': './lib/studio/empty-module.ts',
        '@x402/evm/upto/client': './lib/studio/empty-module.ts',
        '@x402/evm/upto/server': './lib/studio/empty-module.ts',
        '@x402/express': './lib/studio/empty-module.ts',
        '@x402/extensions': './lib/studio/empty-module.ts',
        '@x402/extensions/bazaar': './lib/studio/empty-module.ts',
        '@x402/extensions/builder-code': './lib/studio/empty-module.ts',
        '@x402/fetch': './lib/studio/empty-module.ts',
        '@x402/svm': './lib/studio/empty-module.ts',
        '@x402/svm/exact/client': './lib/studio/empty-module.ts',
        '@x402/svm/exact/server': './lib/studio/empty-module.ts',
        '@x402/svm/exact/v1/client': './lib/studio/empty-module.ts',
      },
    },
  },

  webpack: (config, { isServer, webpack }) => {
    // RainbowKit's index imports wagmi's full connector set, which pulls in
    // @coinbase/cdp-sdk and its optional @x402/* payment modules. ContextLock
    // uses the wallet only to connect and sign on a testnet — no payment path
    // is ever executed — so the whole namespace is ignored rather than adding
    // payment SDKs as dependencies.
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@x402\//,
      }),
    );

    // @metamask/sdk ships one bundle for web and React Native and imports the
    // RN async-storage package unconditionally. In a browser build that code
    // path is never taken, so point it at false rather than installing a React
    // Native dependency into a Next.js app.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    };

    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals.push('pino-pretty', 'lokijs', 'encoding');
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

export default nextConfig;
