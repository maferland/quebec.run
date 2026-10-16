import { JsonLd, organization, website } from '@/components/seo/json-ld'
import type { PageProps } from '@/lib/types/next'
import { connection } from 'next/server'

// Next.js requires a literal here; keep in sync with PUBLIC_PAGE_REVALIDATE_SECONDS in public-cache.ts.
export const revalidate = 86400

export default async function Home({ params }: PageProps<{ locale: string }>) {
  // The Explore shell uses search params. Render this index on the server so
  // its event cards remain crawlable; its database reads are cached in layout.
  await connection()
  const { locale } = await params
  return (
    <>
      <JsonLd data={[organization(), website(locale as 'fr' | 'en')]} />
    </>
  )
}
