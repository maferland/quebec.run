'use client'

import { Children, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export type LoadMoreListProps = {
  /** Pre-rendered children. The server component renders the full list and
   * hands it down; this wrapper only controls how many are mounted. */
  children: React.ReactNode
  initial: number
  step: number
  className?: string
}

/**
 * Client-side load-more wrapper. The full list ships in the initial HTML
 * (so search engines and screen readers see everything) but the visual
 * window slides open in `step`-sized chunks via the button.
 */
export function LoadMoreList({
  children,
  initial,
  step,
  className,
}: LoadMoreListProps) {
  const t = useTranslations('common')
  const items = Children.toArray(children)
  const [visible, setVisible] = useState(Math.min(initial, items.length))

  const remaining = items.length - visible
  const nextChunk = Math.min(step, remaining)

  return (
    <>
      <div className={className}>{items.slice(0, visible)}</div>
      {remaining > 0 && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline-primary"
            onClick={() => setVisible((v) => v + step)}
          >
            {t('loadMore', { count: nextChunk })}
          </Button>
        </div>
      )}
    </>
  )
}
