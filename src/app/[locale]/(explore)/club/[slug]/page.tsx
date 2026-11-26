import { permanentRedirect } from 'next/navigation'

// Stable content is refreshed by its tagged mutation dependencies.
export const revalidate = false
export const dynamicParams = true

export function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ locale: string; slug: string }> }

export default async function ClubPage({ params }: Props) {
  const { locale, slug } = await params
  permanentRedirect(`/${locale}/clubs/${slug}`)
}
