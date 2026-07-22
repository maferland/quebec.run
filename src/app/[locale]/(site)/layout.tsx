import { ConsentBannerWrapper } from '@/components/consent-banner-wrapper'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { SiteProviders } from '@/app/providers'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SiteProviders>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <ConsentBannerWrapper />
    </SiteProviders>
  )
}
