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
      <article className="prose prose-slate prose-lg max-w-none prose-headings:font-heading prose-headings:font-bold prose-h1:text-4xl prose-h1:mb-4 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:mb-4 prose-p:leading-7 prose-ul:mb-4 prose-ul:space-y-2 prose-li:ml-6 prose-strong:font-semibold prose-a:text-primary prose-a:underline">
        <Markdown>{content}</Markdown>
      </article>
    </div>
  )
}
