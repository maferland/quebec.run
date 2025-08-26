import Link from 'next/link'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  href: string
  children: React.ReactNode
  isActive?: boolean
}

export function NavLink({ href, children, isActive = false }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center space-x-1 px-3 py-2 rounded-lg font-body transition-all duration-200',
        'hover:bg-primary/5 hover:text-primary hover:shadow-sm hover:scale-105',
        isActive ? 'text-primary bg-primary/10 shadow-sm' : 'text-accent'
      )}
    >
      {children}
    </Link>
  )
}
