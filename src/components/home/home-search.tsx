'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function HomeSearch() {
  const t = useTranslations('home.search')
  const router = useRouter()
  const [value, setValue] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    router.push(
      trimmed ? `/events?search=${encodeURIComponent(trimmed)}` : '/events'
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
      role="search"
    >
      <div className="relative flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
        />
        <Input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          className="pl-9"
        />
      </div>
      <Button type="submit" variant="primary">
        {t('searchButton')}
      </Button>
    </form>
  )
}
