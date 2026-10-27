import type { NextConfig } from 'next';

// Production builds are a static export served by the Go server (same origin,
// so /api/* needs no proxy). Rewrites are unsupported with `output: "export"`,
// so the dev-only proxy to the Go API is added only for `next dev`.
const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = isDev
  ? {
      async rewrites() {
        return [
          {
            source: '/api/:path*',
            destination: `${process.env.RULEPROOF_API_URL ?? 'http://localhost:8080'}/api/:path*`,
          },
        ];
      },
    }
  : { output: 'export', trailingSlash: true };

export default nextConfig;
