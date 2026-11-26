import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata, type Locale } from '@/lib/seo/metadata'

// Stable content is refreshed by its tagged mutation dependencies.
export const revalidate = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata.clubs' })
  return buildPageMetadata({
    locale: locale as Locale,
    path: '/clubs',
    title: t('title'),
    description: t('description'),
  })
}

export default function ClubsPage() {
  return null
}
