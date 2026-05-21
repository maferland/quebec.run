// Root layout intentionally a pass-through. The real <html>/<body>/<head>
// live in app/[locale]/layout.tsx so we can set lang={locale}. Per Next.js,
// the root layout must still exist and render its children.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
