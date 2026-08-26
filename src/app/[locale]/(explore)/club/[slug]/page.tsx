import { permanentRedirect } from 'next/navigation'

// Next.js requires a literal here; keep in sync with PUBLIC_PAGE_REVALIDATE_SECONDS in public-cache.ts.
export const revalidate = 86400
export const dynamicParams = true

type Props = { params: Promise<{ locale: string; slug: string }> }

export default async function ClubPage({ params }: Props) {
  const { locale, slug } = await params
  permanentRedirect(`/${locale}/clubs/${slug}`)
}
