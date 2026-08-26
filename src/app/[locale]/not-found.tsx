import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { ErrorQuip } from '@/components/error/error-quip'
import { ErrorState, HomeIcon } from '@/components/error/error-state'

export default async function NotFound() {
  const t = await getTranslations('error.404')
  const quips = t.raw('quips') as string[]

  return (
    <ErrorState
      variant="track"
      title={t('title')}
      lede={t('body')}
      meta={t('meta')}
      quip={<ErrorQuip quips={quips} />}
      actions={
        <>
          <Link href="/" className="qr-error-btn is-primary">
            <HomeIcon />
            {t('primary')}
          </Link>
          <Link href="/clubs" className="qr-error-btn is-ghost">
            {t('second')}
          </Link>
        </>
      }
    />
  )
}
