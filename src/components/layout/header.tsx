'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { NavLink } from '@/components/ui/nav-link'
import { MapPin, User, Users, Calendar } from 'lucide-react'

const QuebecRunLogo = () => (
  <div className="flex items-center space-x-3">
    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-sm">
      <MapPin size={18} className="text-text-inverse" />
    </div>
    <div>
      <div className="text-xl font-heading font-bold text-primary leading-tight">
        quebec<span className="text-secondary">.run</span>
      </div>
      <div className="text-xs text-text-secondary font-body opacity-75 -mt-0.5">
        Running Community
      </div>
    </div>
  </div>
)

export function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="bg-surface shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link
            href="/"
            className="flex items-center hover:opacity-90 transition-opacity"
          >
            <QuebecRunLogo />
          </Link>

          <div className="flex items-center space-x-4 md:space-x-8">
            <nav className="hidden sm:flex items-center space-x-4 md:space-x-6">
              <NavLink href="/clubs">
                <Users size={18} />
                <span className="hidden md:inline">Clubs</span>
              </NavLink>
              <NavLink href="/events">
                <Calendar size={18} />
                <span className="hidden md:inline">Events</span>
              </NavLink>
            </nav>

            <div className="flex items-center space-x-2 md:space-x-3">
              {status === 'loading' ? (
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-8 bg-surface-secondary rounded-md animate-pulse" />
                  <div className="w-16 h-8 bg-surface-secondary rounded-md animate-pulse" />
                </div>
              ) : session ? (
                <div className="flex items-center space-x-2 md:space-x-3">
                  {session.user?.isAdmin && (
                    <NavLink href="/admin">
                      <span>Admin</span>
                    </NavLink>
                  )}
                  <div className="hidden sm:flex items-center space-x-2 px-2 py-1 bg-surface-variant rounded-lg">
                    <User size={14} className="text-text-secondary" />
                    <span className="text-xs text-text-secondary font-body max-w-20 truncate">
                      {session.user?.name?.split(' ')[0] || 'User'}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => signOut()}>
                    <span className="hidden sm:inline">Sign Out</span>
                    <span className="sm:hidden">Out</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => signIn()}
                    variant="outline-primary"
                  >
                    Sign In
                  </Button>
                  <Button size="sm" variant="secondary">
                    <span className="hidden sm:inline">Join Run</span>
                    <span className="sm:hidden">Join</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
