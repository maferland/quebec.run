import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ExploreShell } from '@/components/explore/explore-shell'
import { RunDetailOverlay } from '@/components/explore/detail-panel'
import { buildPageMetadata, type Locale } from '@/lib/seo/metadata'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

type Props = { params: Promise<{ locale: string; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: 'metadata.eventDetail' })

  // Virtual IDs contain '--' (slug--YYYY-MM-DD); concrete IDs are cuid strings
  const isVirtual = id.includes('--') || id.includes(':')
  let title: string | null = null
  let clubName: string | null = null

  if (!isVirtual) {
    const event = await prisma.event.findUnique({
      where: { id },
      select: { title: true, club: { select: { name: true } } },
    })
    title = event?.title ?? null
    clubName = event?.club?.name ?? null
  } else {
    const slugPart = id.split('--')[0].split(':')[0]
    const rec = await prisma.recurringEvent.findFirst({
      where: { OR: [{ slug: slugPart }, { id: slugPart }] },
      select: { title: true, club: { select: { name: true } } },
    })
    title = rec?.title ?? null
    clubName = rec?.club?.name ?? null
  }

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
  return (
    <>
      <ExploreShell />
      <RunDetailOverlay id={id} />
    </>
  )
}
