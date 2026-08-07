'use client'

import { useTheme } from '@/components/explore/theme-provider'

export function SiteThemeRoot({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()

  return (
    <div className="qr-root qr-doc" data-theme={theme} suppressHydrationWarning>
      {children}
    </div>
  )
}
