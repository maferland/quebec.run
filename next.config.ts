import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { withSentryConfig } from '@sentry/nextjs'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  // Decodes minified prod errors from Vercel logs to real file/line.
  productionBrowserSourceMaps: true,
  async redirects() {
    return [
      // Old list pages → home (explore shell)
      {
        source: '/:locale/events',
        destination: '/:locale',
        permanent: true,
      },
      {
        source: '/:locale/calendar',
        destination: '/:locale',
        permanent: true,
      },
    ]
  },
}

export default withSentryConfig(withNextIntl(nextConfig), {
  // Source map upload is skipped when SENTRY_AUTH_TOKEN is unset, so builds
  // still succeed without it.
  org: 'quebecrun',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
  telemetry: false,
  webpack: {
    treeshake: { removeDebugLogging: true },
    // Creates a Sentry monitor per vercel.json cron entry. Webpack-only, which
    // is fine since this project does not build with Turbopack.
    automaticVercelMonitors: true,
  },
})
