'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { setAccount } from './passport-store'

type Props = {
  onDone: () => void
}

export function PassportAuth({ onDone }: Props) {
  const t = useTranslations('explore')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError(t('passport_required'))
      return
    }
    setAccount({ name: name.trim(), email: email.trim() })
    onDone()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--r-md)',
    padding: '12px 14px',
    fontFamily: 'var(--font-ui)',
    fontSize: 15,
    color: 'var(--text)',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2
          style={{
            fontSize: 22,
            margin: '0 0 6px',
            letterSpacing: '-0.02em',
          }}
        >
          {t('passport_title')}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: 'var(--dim)',
            lineHeight: 1.5,
          }}
        >
          {t('passport_subtitle')}
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <input
          style={inputStyle}
          type="text"
          placeholder={t('passport_name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
        <input
          style={inputStyle}
          type="email"
          placeholder={t('passport_email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        {error && (
          <span style={{ fontSize: 13, color: 'var(--coral)' }}>{error}</span>
        )}
        <button
          type="submit"
          style={{
            border: 'none',
            background: 'var(--accent)',
            color: 'var(--accent-ink)',
            borderRadius: 100,
            padding: '13px 20px',
            fontFamily: 'var(--font-ui)',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            marginTop: 4,
          }}
        >
          {t('passport_start')}
        </button>
      </form>
    </div>
  )
}
