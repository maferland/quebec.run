import { JsonLd, organization, website } from '@/components/seo/json-ld'
import type { PageProps } from '@/lib/types/next'
import { getTranslations } from 'next-intl/server'

// Next.js requires a literal here; keep in sync with PUBLIC_PAGE_REVALIDATE_SECONDS in public-cache.ts.
export const revalidate = 86400

export default async function Home({ params }: PageProps<{ locale: string }>) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata.home' })
  return (
    <>
      <h1 className="sr-only">{t('title')}</h1>
      <JsonLd data={[organization(), website(locale as 'fr' | 'en')]} />
    </>
  )
}
