'use client'

import { useState, useEffect } from 'react'
import { NavigationLinks } from '@/components/layout/navigation-links'
import { AuthButtons } from '@/components/layout/auth-buttons'
import { useTranslations } from 'next-intl'

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const t = useTranslations('navigation')

  const toggleMenu = () => {
    if (!isOpen) {
      setIsOpen(true)
      setTimeout(() => setIsAnimating(true), 10)
    } else {
      closeMenu()
    }
  }

  const closeMenu = () => {
    setIsAnimating(false)
    setTimeout(() => setIsOpen(false), 200)
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <div className="sm:hidden">
      {/* Hamburger Menu Button */}
      <button
        onClick={toggleMenu}
        aria-label={isOpen ? t('closeMenu') : t('openMenu')}
        aria-expanded={isOpen}
        className="relative z-[1002] p-2 rounded-lg hover:bg-surface-variant transition-colors"
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          <span className="sr-only">
            {isOpen ? t('closeMenu') : t('openMenu')}
          </span>
          <div className="w-5 h-4 flex flex-col justify-between">
            <span
              className={`block h-0.5 w-full bg-text-primary transition-all duration-300 ease-in-out ${
                isOpen ? 'rotate-45 translate-y-[7px]' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-full bg-text-primary transition-all duration-300 ease-in-out ${
                isOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-full bg-text-primary transition-all duration-300 ease-in-out ${
                isOpen ? '-rotate-45 -translate-y-[7px]' : ''
              }`}
            />
          </div>
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/20 z-[1000] transition-opacity duration-200 ${
              isAnimating ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeMenu}
            aria-hidden="true"
          />

          {/* Menu Content */}
          <div
            className={`fixed top-20 right-4 left-4 bg-surface border border-border rounded-lg shadow-lg z-[1001] p-4 transition-all duration-200 ${
              isAnimating
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 -translate-y-4'
            }`}
          >
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
