'use client'

import { Children, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export type ColumnConfig = {
  base: number
  md?: number
  lg?: number
}

export type LoadMoreListProps = {
  /** Pre-rendered children. The server component renders the full list and
   * hands it down; this wrapper only controls how many are mounted. */
  children: React.ReactNode
  initial: number
  step: number
  className?: string
  /** Column count per breakpoint. When provided, the visible window is
   * trimmed to a clean multiple of the active breakpoint's column count
   * so the grid never ends on a partial row — except when the entire list
   * is visible. */
  columns?: ColumnConfig
}

function useColumnCount(columns: ColumnConfig | undefined): number {
  const lgValue = columns?.lg ?? columns?.md ?? columns?.base ?? 1
  const [cols, setCols] = useState(lgValue)

  useEffect(() => {
    if (!columns) {
      setCols(1)
      return
    }
    const md = window.matchMedia('(min-width: 768px)')
    const lg = window.matchMedia('(min-width: 1024px)')
    const update = () => {
      if (lg.matches && columns.lg !== undefined) setCols(columns.lg)
      else if (md.matches && columns.md !== undefined) setCols(columns.md)
      else setCols(columns.base)
    }
    update()
    md.addEventListener('change', update)
    lg.addEventListener('change', update)
    return () => {
      md.removeEventListener('change', update)
      lg.removeEventListener('change', update)
    }
  }, [columns])

  return cols
}

/**
 * Client-side load-more wrapper. The full list ships in the initial HTML
 * (so search engines and screen readers see everything) but the visual
 * window slides open in `step`-sized chunks via the button.
 *
 * When `columns` is provided, the visible window is rounded down to a
 * clean multiple of the active breakpoint's column count so the grid
 * never ends on a partial row — unless the whole list is showing.
 */
export function LoadMoreList({
  children,
  initial,
  step,
  className,
  columns,
}: LoadMoreListProps) {
  const t = useTranslations('common')
  const items = Children.toArray(children)
  const [budget, setBudget] = useState(Math.min(initial, items.length))
  const cols = useColumnCount(columns)

  const atEnd = budget >= items.length
  const trimmed = Math.floor(budget / cols) * cols
  const visible = atEnd ? items.length : Math.max(trimmed, 1)
  const remaining = items.length - visible
  const nextChunk = Math.min(step, remaining)

  return (
    <>
      <div className={className}>{items.slice(0, visible)}</div>
      {remaining > 0 && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline-primary"
            onClick={() => setBudget((v) => v + step)}
          >
            {t('loadMore', { count: nextChunk })}
          </Button>
        </div>
      )}
    </>
  )
}
