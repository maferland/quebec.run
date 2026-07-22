import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
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

export default withNextIntl(nextConfig)
