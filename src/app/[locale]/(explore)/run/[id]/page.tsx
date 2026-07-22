import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata, type Locale } from '@/lib/seo/metadata'
import { getEventById } from '@/lib/services/events'

export const revalidate = 900
export const dynamicParams = true

type Props = { params: Promise<{ locale: string; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: 'metadata.eventDetail' })

  const event = await getEventById({ data: { id } }).catch(() => null)
  const title = event?.title ?? null
  const clubName = event?.club?.name ?? null

  return buildPageMetadata({
    locale: locale as Locale,
    path: `/run/${id}`,
    title:
      title && clubName
        ? t('title', { eventTitle: title, clubName })
        : 'quebec.run',
    description:
      title && clubName
        ? t('description', { eventTitle: title, clubName })
        : '',
    noIndex: !title,
  })
}

export default async function RunPage({ params }: Props) {
  await params
  return null
}
