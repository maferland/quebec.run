import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ExploreShell } from '@/components/explore/explore-shell'
import { ClubDetailOverlay } from '@/components/explore/detail-panel'
import { buildPageMetadata, type Locale } from '@/lib/seo/metadata'
import { getClubBySlug } from '@/lib/services/clubs'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const club = await getClubBySlug({ slug })
  const t = await getTranslations({ locale, namespace: 'metadata.clubDetail' })
  return buildPageMetadata({
    locale: locale as Locale,
    path: `/club/${slug}`,
    title: club ? t('title', { clubName: club.name }) : slug,
    description: club
      ? t('description', { clubName: club.name })
      : t('description', { clubName: slug }),
    noIndex: !club,
  })
}

export default async function ClubPage({ params }: Props) {
  const { slug } = await params
  return (
    <>
      <ExploreShell />
      <ClubDetailOverlay slug={slug} />
    </>
  )
}
