import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { RunDetailOverlay } from '@/components/explore/detail-panel'
import { buildPageMetadata, type Locale } from '@/lib/seo/metadata'
import { prisma } from '@/lib/prisma'
import { unstable_cache } from 'next/cache'
import {
  PUBLIC_CACHE_TAGS,
  PUBLIC_PAGE_REVALIDATE_SECONDS,
} from '@/lib/public-cache'

export const revalidate = 900
export const dynamicParams = true

type Props = { params: Promise<{ locale: string; id: string }> }

const getRunMetadata = unstable_cache(
  async (id: string) => {
    // Virtual IDs contain '--' (slug--YYYY-MM-DD); concrete IDs are cuid strings.
    const isVirtual = id.includes('--') || id.includes(':')

    if (!isVirtual) {
      const event = await prisma.event.findUnique({
        where: { id },
        select: { title: true, club: { select: { name: true } } },
      })
      return {
        title: event?.title ?? null,
        clubName: event?.club?.name ?? null,
      }
    }

    const slugPart = id.split('--')[0].split(':')[0]
    const rec = await prisma.recurringEvent.findFirst({
      where: { OR: [{ slug: slugPart }, { id: slugPart }] },
      select: { title: true, club: { select: { name: true } } },
    })
    return {
      title: rec?.title ?? null,
      clubName: rec?.club?.name ?? null,
    }
  },
  ['run-metadata'],
  {
    revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS,
    tags: [PUBLIC_CACHE_TAGS.runs],
  }
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: 'metadata.eventDetail' })

  const { title, clubName } = await getRunMetadata(id)

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
  const { id } = await params
  return <RunDetailOverlay id={id} />
}
