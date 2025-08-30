'use client'

import { Link } from '@/i18n/navigation'
import { usePathname } from 'next/navigation'
import { BarChart3, Users, Calendar, Settings, Home } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'dashboard', href: '/admin', icon: BarChart3 },
  { name: 'clubs', href: '/admin/clubs', icon: Users },
  { name: 'events', href: '/admin/events', icon: Calendar },
  { name: 'settings', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const t = useTranslations('admin.navigation')

  return (
    <div className="flex flex-col h-full bg-surface shadow-sm border-r border-border">
      {/* Header */}
      <div className="flex items-center px-6 py-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Settings className="w-4 h-4 text-text-inverse" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-semibold text-primary">
              Admin
            </h1>
            <p className="text-xs text-text-secondary">
              Management Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href))
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-text-inverse'
                  : 'text-text-secondary hover:bg-surface-variant hover:text-text-primary'
              )}
            >
              <Icon className="w-4 h-4 mr-3" />
              {t(item.name)}
            </Link>
          )
        })}
      </nav>

      {/* Back to Site */}
      <div className="p-4 border-t border-border">
        <Link
          href="/"
          className="flex items-center px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-variant hover:text-text-primary rounded-md transition-colors"
        >
          <Home className="w-4 h-4 mr-3" />
          Back to Site
        </Link>
      </div>
    </div>
  )
}