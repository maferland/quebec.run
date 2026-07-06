import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
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
      // Old plural club/event detail URLs → new singular canonical URLs
      {
        source: '/:locale/clubs/:slug',
        destination: '/:locale/club/:slug',
        permanent: true,
      },
      {
        source: '/:locale/events/:id',
        destination: '/:locale/run/:id',
        permanent: true,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
