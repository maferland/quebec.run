const TYPE_HUE: Record<string, string> = {
  trail: 'var(--t-trail)',
  road: 'var(--t-road)',
  track: 'var(--t-track)',
  mixed: 'var(--t-mixed)',
}

export const PACE_BUCKETS = [
  { id: 'any', lo: 0, hi: 99 },
  {
    id: 'fast',
    lo: 0,
    hi: 4.5,
    labelFr: 'Rapide',
    labelEn: 'Fast',
    sub: '< 4:30',
  },
  {
    id: 'moderate',
    lo: 4.5,
    hi: 6.0,
    labelFr: 'Modérée',
    labelEn: 'Moderate',
    sub: '4:30–6:00',
  },
  {
    id: 'easy',
    lo: 6.0,
    hi: 99,
    labelFr: 'Tranquille',
    labelEn: 'Easy',
    sub: '6:00 +',
  },
] as const

export function paceStr(decimal: string): string {
  const d = parseFloat(decimal)
  let m = Math.floor(d)
  let s = Math.round((d - m) * 60)
  if (s === 60) {
    m++
    s = 0
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

export function paceRange(
  paceMin: string | null,
  paceMax: string | null
): string | null {
  if (!paceMin || !paceMax) return null
  return `${paceStr(paceMin)}–${paceStr(paceMax)}`
}

export function todBucket(time: string): 'am' | 'pm' | 'eve' {
  const [h] = time.split(':').map(Number)
  return (h ?? 0) < 12 ? 'am' : (h ?? 0) < 17 ? 'pm' : 'eve'
}

function AttrPill({
  dotKind,
  children,
}: {
  dotKind?: string
  children: React.ReactNode
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        fontFamily: 'var(--font-ui)',
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--dim)',
        background: 'var(--surface-2)',
        padding: '6px 11px',
        borderRadius: 100,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {dotKind && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 9,
            background: TYPE_HUE[dotKind] ?? 'var(--faint)',
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  )
}

export function TypeTag({
  kind,
  label,
}: {
  kind: string | null
  label: string
}) {
  return <AttrPill dotKind={kind ?? undefined}>{label}</AttrPill>
}

export function VibePill({ label }: { label: string }) {
  return <AttrPill>{label}</AttrPill>
}

export function MetaPill({
  icon,
  children,
}: {
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 12.5,
        color: 'var(--dim)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {icon && (
        <span style={{ color: 'var(--faint)', display: 'inline-flex' }}>
          {icon}
        </span>
      )}
      {children}
    </span>
  )
}

export function Flag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-ui)',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--accent-fg)',
        background: 'var(--lime-dim)',
        padding: '6px 11px',
        borderRadius: 100,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

export function Stamp({
  tone,
  children,
}: {
  tone: 'cancelled' | 'past'
  children: React.ReactNode
}) {
  const c =
    tone === 'cancelled'
      ? {
          color: 'var(--coral)',
          bg: 'var(--coral-dim)',
          border: 'color-mix(in oklch, var(--coral) 35%, transparent)',
        }
      : {
          color: 'var(--dim)',
          bg: 'var(--surface-3)',
          border: 'var(--line-2)',
        }
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10.5,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '.08em',
        color: c.color,
        background: c.bg,
        border: `1px solid ${c.border}`,
        padding: '3px 8px',
        borderRadius: 6,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}
