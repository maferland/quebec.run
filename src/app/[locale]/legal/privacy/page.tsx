import { readFile } from 'fs/promises'
import { join } from 'path'
import Markdown from 'react-markdown'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal.privacy' })

  return {
    title: t('title'),
  }
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const filePath = join(process.cwd(), 'messages', locale, 'privacy.md')
  const content = await readFile(filePath, 'utf-8')

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="prose prose-lg max-w-none">
        <Markdown>{content}</Markdown>
      </div>
    </div>
  )
}
