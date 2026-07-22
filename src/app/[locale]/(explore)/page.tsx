import { JsonLd, organization, website } from '@/components/seo/json-ld'
import type { PageProps } from '@/lib/types/next'
import { getTranslations } from 'next-intl/server'

export const revalidate = 900

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
