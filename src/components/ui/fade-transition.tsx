'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type FadeTransitionProps = {
  show: boolean
  children: ReactNode
  className?: string
}

export function FadeTransition({
  show,
  children,
  className,
}: FadeTransitionProps) {
  return (
    <div
      className={cn(
        'transition-opacity duration-300',
        show ? 'opacity-100' : 'opacity-40',
        className
      )}
    >
      {children}
    </div>
  )
}
