'use client'

import { useState, useRef, useEffect } from 'react'
import { User, LogOut, ChevronDown } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'

interface UserDropdownProps {
  userName: string
  userEmail?: string
}

export function UserDropdown({ userName, userEmail }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('navigation')

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = () => {
    setIsOpen(false)
    signOut()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md bg-surface hover:bg-surface-variant border border-border transition-colors focus:outline-none focus:ring-2 focus:ring-focus"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <User size={16} className="text-text-secondary" />
        <span className="text-sm text-text-primary font-medium max-w-24 truncate">
          {userName.split(' ')[0]}
        </span>
        <ChevronDown
          size={14}
          className={`text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg border border-border z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm font-medium text-text-primary truncate">
                {userName}
              </p>
              {userEmail && (
                <p className="text-xs text-text-secondary truncate">
                  {userEmail}
                </p>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-2 text-sm text-text-primary hover:bg-surface-variant transition-colors"
            >
              <LogOut size={16} className="mr-3 text-text-secondary" />
              {t('signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
