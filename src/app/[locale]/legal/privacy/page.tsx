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
      <article className="prose prose-slate max-w-none prose-h1:mb-2 prose-h2:mt-6 prose-h2:mb-3 prose-h3:mt-4 prose-h3:mb-2 prose-p:my-3 prose-ul:my-3 prose-li:my-1">
        <Markdown>{content}</Markdown>
      </article>
    </div>
  )
}
