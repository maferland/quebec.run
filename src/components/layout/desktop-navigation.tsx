'use client'

import { NavigationLinks } from '@/components/layout/navigation-links'
import { AuthButtons } from '@/components/layout/auth-buttons'

export function DesktopNavigation() {
  return (
    <div className="hidden sm:flex items-center space-x-4 md:space-x-8">
      <NavigationLinks variant="desktop" />
      <AuthButtons variant="desktop" />
    </div>
  )
}
