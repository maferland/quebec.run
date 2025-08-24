// Next.js 15 App Router type utilities

export type PageProps<
  TParams = Record<string, never>,
  TSearchParams = Record<string, never>,
> = {
  params: Promise<TParams>
  searchParams: Promise<TSearchParams>
}

export type LayoutProps<TParams = Record<string, never>> = {
  children: React.ReactNode
  params: Promise<TParams>
}

// Common dynamic route params
export type SlugParams = { slug: string }
export type IdParams = { id: string }

// Specific page prop types
export type SlugPageProps = PageProps<SlugParams>
export type IdPageProps = PageProps<IdParams>
