'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { NavigationLinks } from '@/components/layout/navigation-links'
import { AuthButtons } from '@/components/layout/auth-buttons'
import { Menu, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations('navigation')

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <div className="sm:hidden">
      {/* Hamburger Menu Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleMenu}
        aria-label={isOpen ? t('closeMenu') : t('openMenu')}
        aria-expanded={isOpen}
        className="relative z-50"
      >
        <Icon icon={isOpen ? X : Menu} size="sm" decorative />
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={closeMenu}
            aria-hidden="true"
          />

          {/* Menu Content */}
          <div className="fixed top-20 right-4 left-4 bg-surface border border-border rounded-lg shadow-lg z-40 p-4">
            <div className="flex flex-col space-y-4">
              <NavigationLinks variant="mobile" onLinkClick={closeMenu} />

              <hr className="border-border" />

              <AuthButtons variant="mobile" onAction={closeMenu} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
