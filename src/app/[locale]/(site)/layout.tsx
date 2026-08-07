import { ConsentBannerWrapper } from '@/components/consent-banner-wrapper'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { SiteThemeRoot } from '@/components/layout/site-theme-root'
import { SiteProviders } from '@/app/providers'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SiteProviders>
      <SiteThemeRoot>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </SiteThemeRoot>
      <ConsentBannerWrapper />
    </SiteProviders>
  )
}
