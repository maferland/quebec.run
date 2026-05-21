'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { NavigationLinks } from '@/components/layout/navigation-links'
import { AuthButtons } from '@/components/layout/auth-buttons'
import { Menu, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations('navigation')

  const toggleMenu = () => setIsOpen((open) => !open)
  const closeMenu = () => setIsOpen(false)

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  // Close on Escape so keyboard users can dismiss without locating the button.
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen])

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={toggleMenu}
        aria-label={isOpen ? t('closeMenu') : t('openMenu')}
        aria-expanded={isOpen}
        aria-controls="mobile-menu-drawer"
        className="relative z-[1101] inline-flex items-center justify-center w-11 h-11 rounded-xl text-primary hover:bg-primary/10 active:bg-primary/20 transition-colors"
      >
        <Icon icon={isOpen ? X : Menu} size="md" decorative />
      </button>

      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[1099] transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <aside
        id="mobile-menu-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t('menuTitle')}
        className={`fixed top-0 right-0 bottom-0 z-[1100] w-[85%] max-w-sm bg-surface shadow-2xl transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full pt-20 pb-6 px-5">
          <NavigationLinks variant="mobile" onLinkClick={closeMenu} />

          <div className="mt-auto pt-6 border-t border-border">
            <AuthButtons variant="mobile" onAction={closeMenu} />
          </div>
        </div>
      </aside>
    </div>
  )
}
