import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/metadata'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
}

// Root layout intentionally a pass-through. The real <html>/<body>/<head>
// live in app/[locale]/layout.tsx so we can set lang={locale}. Per Next.js,
// the root layout must still exist and render its children.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
