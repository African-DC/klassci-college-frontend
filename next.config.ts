import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

// Security headers applied to every route.
//
// CSP is shipped in **Report-Only** mode for the first iteration. The browser
// logs violations to the DevTools console but does NOT block. After 24-48h of
// monitoring real traffic we flip to enforced mode by switching the header key
// to `Content-Security-Policy`.
//
// CSP allows inline styles/scripts that Next.js needs (Tailwind injects styles,
// Next.js emits inline scripts for hydration). When we move to nonces, we can
// drop 'unsafe-inline'.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const apiOrigin = (() => {
  try {
    return API_URL ? new URL(API_URL).origin : '';
  } catch {
    return '';
  }
})();

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  // connect-src includes 'self' (same-origin nginx → /api), the explicit API
  // origin if it's cross-origin, and Sentry ingest hosts so client-side error
  // reporting keeps working when SENTRY_DSN is set later.
  `connect-src 'self' ${apiOrigin} https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io`.trim(),
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');

// CSP enforcement is opt-in via env var. Keep Report-Only as the safe default
// until violations are observed clean for 24-48h.
const CSP_ENFORCED = process.env.CSP_ENFORCED === 'true';
const CSP_HEADER_KEY = CSP_ENFORCED
  ? 'Content-Security-Policy'
  : 'Content-Security-Policy-Report-Only';

const SECURITY_HEADERS = [
  { key: CSP_HEADER_KEY, value: CSP },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const nextConfig: NextConfig = {
  typedRoutes: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.digitaloceanspaces.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
    webpackMemoryOptimizations: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

// Wrap with Sentry — no-op at runtime if DSN not configured.
// Source maps are uploaded only when SENTRY_AUTH_TOKEN is provided at build time.
export default withSentryConfig(nextConfig, {
  silent: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
