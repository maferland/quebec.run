type ParamValue = string | number | boolean | null | undefined

export function buildFetchUrl(
  base: string,
  params: Record<string, ParamValue>
): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `${base}?${qs}` : base
}
