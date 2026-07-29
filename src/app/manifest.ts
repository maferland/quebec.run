import type { MetadataRoute } from 'next'
import { SITE_NAME } from '@/lib/seo/metadata'

// The manifest is a single static file, so it cannot vary by locale. It uses
// French, the default locale, to match what an installed app opens to.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} | Où courir ce soir à Québec ?`,
    short_name: SITE_NAME,
    description:
      'Tous les clubs de course de Québec sur une carte. Trouve une sortie ce soir.',
    start_url: '/fr',
    display: 'standalone',
    background_color: '#161b26',
    theme_color: '#161b26',
    // Each size is listed twice: the tile is full-bleed and the mark sits
    // inside the maskable safe zone, so one asset covers both purposes.
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
