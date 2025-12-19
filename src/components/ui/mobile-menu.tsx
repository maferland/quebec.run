'use client'

import { useState, useEffect, useRef } from 'react'
import { NavigationLinks } from '@/components/layout/navigation-links'
import { AuthButtons } from '@/components/layout/auth-buttons'
import { useTranslations } from 'next-intl'

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const t = useTranslations('navigation')
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

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
    setTimeout(() => {
      setIsOpen(false)
      buttonRef.current?.focus()
    }, 200)
  }

  // Body scroll lock
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

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Focus trap
  useEffect(() => {
    if (!isOpen || !menuRef.current) return

    const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus first element when menu opens
    firstElement?.focus()

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen, isAnimating])

  return (
    <div className="sm:hidden">
      {/* Hamburger Menu Button */}
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        aria-label={isOpen ? t('closeMenu') : t('openMenu')}
        aria-expanded={isOpen}
        className="relative z-[1002] p-3 rounded-lg hover:bg-surface-variant transition-colors"
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
            ref={menuRef}
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
