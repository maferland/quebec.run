'use client'

import { Button } from '@/components/ui/button'
import { NavLink } from '@/components/ui/nav-link'
import { User } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

type AuthButtonsProps = {
  variant: 'desktop' | 'mobile'
  onAction?: () => void
}

export function AuthButtons({ variant, onAction }: AuthButtonsProps) {
  const { data: session, status } = useSession()
  const t = useTranslations('navigation')
  const router = useRouter()

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-16 h-8 bg-surface-secondary rounded-md animate-pulse" />
        <div className="w-16 h-8 bg-surface-secondary rounded-md animate-pulse" />
      </div>
    )
  }

  if (session) {
    return (
      <div
        className={
          variant === 'desktop'
            ? 'flex items-center space-x-2 md:space-x-3'
            : 'space-y-3'
        }
      >
        {variant === 'desktop' && session.user?.isStaff && (
          <NavLink href="/admin">
            <span>{t('admin')}</span>
          </NavLink>
        )}

        {variant === 'desktop' && (
          <div className="hidden sm:flex items-center space-x-2 px-2 py-1 bg-surface-variant rounded-lg">
            <User size={14} className="text-text-secondary" />
            <span className="text-xs text-text-secondary font-body max-w-20 truncate">
              {session.user?.name?.split(' ')[0] || t('user')}
            </span>
          </div>
        )}

        {variant === 'mobile' && (
          <div className="px-3 py-2 bg-surface-variant rounded-lg">
            <div className="flex items-center space-x-2">
              <User size={16} className="text-text-secondary" />
              <span className="text-sm text-text-secondary font-body">
                {session.user?.name || t('user')}
              </span>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            signOut()
            onAction?.()
          }}
          className={variant === 'mobile' ? 'w-full justify-center' : ''}
        >
          {variant === 'desktop' ? (
            <>
              <span className="hidden sm:inline">{t('signOut')}</span>
              <span className="sm:hidden">{t('signOutShort')}</span>
            </>
          ) : (
            t('signOut')
          )}
        </Button>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      onClick={() => {
        router.push('/auth/signin')
        onAction?.()
      }}
      variant="outline-primary"
      className={variant === 'mobile' ? 'w-full justify-center' : ''}
    >
      {t('signIn')}
    </Button>
  )
}
