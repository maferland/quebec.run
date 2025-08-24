export function createSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      // Normalize and remove accents
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Replace spaces and special characters with hyphens
      .replace(/[\s\W-]+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
      // Limit length
      .slice(0, 50)
      // Clean up any trailing hyphens after truncation
      .replace(/-+$/, '')
  )
}

export function createUniqueSlug(
  baseSlug: string,
  existingSlugs: string[]
): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug
  }

  let counter = 2
  let newSlug = `${baseSlug}-${counter}`

  while (existingSlugs.includes(newSlug)) {
    counter++
    newSlug = `${baseSlug}-${counter}`
  }

  return newSlug
}
