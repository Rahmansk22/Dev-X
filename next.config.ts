import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "inngest",
    "@inngest/agent-kit",
    "@opentelemetry/instrumentation",
    "@opentelemetry/api",
    "@prisma/instrumentation",
    "@traceloop/instrumentation-anthropic",
    "require-in-the-middle",
    "import-in-the-middle",
    "e2b",
    "node:module",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "logos-world.net",
      },
      {
        protocol: "https",
        hostname: "seeklogo.com",
      },
      {
        protocol: "https",
        hostname: "framerusercontent.com",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
  /* Disable ESLint warnings only during production builds */
  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@tanstack/react-query",
      "@trpc/client",
      "@trpc/react-query",
      "framer-motion",
      "motion",
      "react-icons",
      "gsap",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "sonner",
      "react-hot-toast",
    ],
  },

  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = {
        type: "filesystem",
      };
      config.parallelism = 20;
    }
    return config;
  },
};

const isDev = process.env.NODE_ENV === "development";

const sentryWrappedConfig = withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "devx-05",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});

export default isDev ? nextConfig : sentryWrappedConfig;
