'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { MapPin, Calendar, User } from 'lucide-react'

export function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Courses
            </Link>
          </div>
          
          <nav className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md"
            >
              <MapPin size={20} />
              <span>Map</span>
            </Link>
            <Link 
              href="/calendar" 
              className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md"
            >
              <Calendar size={20} />
              <span>Calendar</span>
            </Link>
            
            {status === 'loading' ? (
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            ) : session ? (
              <div className="flex items-center space-x-4">
                {session.user?.isAdmin && (
                  <Link 
                    href="/admin" 
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md"
                  >
                    Admin
                  </Link>
                )}
                <div className="flex items-center space-x-2">
                  <User size={20} className="text-gray-600" />
                  <span className="text-sm text-gray-700">{session.user?.name || session.user?.email}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button 
                size="sm"
                onClick={() => signIn()}
              >
                Sign In
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}