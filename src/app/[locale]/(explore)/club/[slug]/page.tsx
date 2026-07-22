import { permanentRedirect } from 'next/navigation'

export const revalidate = 900
export const dynamicParams = true

type Props = { params: Promise<{ locale: string; slug: string }> }

export default async function ClubPage({ params }: Props) {
  const { locale, slug } = await params
  permanentRedirect(`/${locale}/clubs/${slug}`)
}
