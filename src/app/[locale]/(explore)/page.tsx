import { JsonLd, organization, website } from '@/components/seo/json-ld'
import type { PageProps } from '@/lib/types/next'

// Next.js requires a literal here; keep in sync with PUBLIC_PAGE_REVALIDATE_SECONDS in public-cache.ts.
export const revalidate = 86400

export default async function Home({ params }: PageProps<{ locale: string }>) {
  const { locale } = await params
  return (
    <>
      <JsonLd data={[organization(), website(locale as 'fr' | 'en')]} />
    </>
  )
}
