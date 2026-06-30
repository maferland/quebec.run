import { ExploreShell } from '@/components/explore/explore-shell'
import { JsonLd, organization, website } from '@/components/seo/json-ld'
import type { PageProps } from '@/lib/types/next'

export const dynamic = 'force-dynamic'

export default async function Home({ params }: PageProps<{ locale: string }>) {
  const { locale } = await params
  return (
    <>
      <JsonLd data={[organization(), website(locale as 'fr' | 'en')]} />
      <ExploreShell />
    </>
  )
}
