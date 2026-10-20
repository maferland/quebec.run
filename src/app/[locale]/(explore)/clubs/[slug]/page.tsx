import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata, SITE_URL, type Locale } from '@/lib/seo/metadata'
import { getClubBySlug } from '@/lib/services/clubs'
import {
  JsonLd,
  breadcrumbList,
  sportsOrganization,
} from '@/components/seo/json-ld'
import { notFound } from 'next/navigation'

// Next.js requires a literal here; keep in sync with PUBLIC_PAGE_REVALIDATE_SECONDS in public-cache.ts.
export const revalidate = 86400
export const dynamicParams = true

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const club = await getClubBySlug({ slug }).catch(() => null)
  const t = await getTranslations({ locale, namespace: 'metadata.clubDetail' })

  return buildPageMetadata({
    locale: locale as Locale,
    path: `/clubs/${slug}`,
    title: club ? t('title', { clubName: club.name }) : slug,
    description: club
      ? t('description', { clubName: club.name })
      : t('description', { clubName: slug }),
    ogImage: club
      ? `${SITE_URL}/${locale}/clubs/${slug}/opengraph-image`
      : undefined,
    noIndex: !club,
  })
}

export default async function ClubPage({ params }: Props) {
  const { locale, slug } = await params
  const club = await getClubBySlug({ slug }).catch(() => null)
  if (!club) notFound()
  const tEvents = await getTranslations('events')

  return (
    <>
      <JsonLd
        data={[
          sportsOrganization({
            locale: locale as 'fr' | 'en',
            name: club.name,
            slug,
            description: club.description,
            website: club.website,
            instagram: club.instagram,
            facebook: club.facebook,
            stravaSlug: club.stravaSlug,
          }),
          breadcrumbList([
            {
              name: tEvents('breadcrumb.clubs'),
              url: `${SITE_URL}/${locale}/clubs`,
            },
            { name: club.name, url: `${SITE_URL}/${locale}/clubs/${slug}` },
          ]),
        ]}
      />
    </>
  )
}
