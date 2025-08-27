import fs from 'fs'
import path from 'path'

type Locale = 'en' | 'fr'

interface TranslationCache {
  [locale: string]: Record<string, unknown>
}

// Cache loaded translations to avoid re-reading files
const translationCache: TranslationCache = {}

/**
 * Load translation file for a specific locale
 */
function loadTranslations(locale: Locale): Record<string, unknown> {
  if (translationCache[locale]) {
    return translationCache[locale]
  }

  const translationPath = path.join(process.cwd(), 'messages', `${locale}.json`)

  try {
    const translationData = fs.readFileSync(translationPath, 'utf-8')
    const translations = JSON.parse(translationData)
    translationCache[locale] = translations
    return translations
  } catch (error) {
    throw new Error(
      `Failed to load translations for locale "${locale}": ${error}`
    )
  }
}

/**
 * Get nested translation value by key path (e.g., "calendar.title")
 */
function getNestedValue(obj: Record<string, unknown>, keyPath: string): string {
  const keys = keyPath.split('.')
  let value = obj

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    } else {
      throw new Error(`Translation key "${keyPath}" not found`)
    }
  }

  if (typeof value !== 'string') {
    throw new Error(`Translation key "${keyPath}" does not resolve to a string`)
  }

  return value
}

/**
 * Get translated text for a specific key path and locale
 */
export function getTranslation(keyPath: string, locale: Locale = 'en'): string {
  const translations = loadTranslations(locale)
  return getNestedValue(translations, keyPath)
}

/**
 * Get translations for both English and French locales
 */
export function getBilingualTranslations(keyPath: string) {
  return {
    en: getTranslation(keyPath, 'en'),
    fr: getTranslation(keyPath, 'fr'),
  }
}

/**
 * Validate that a translation key exists in all locales
 */
export function validateTranslationKey(keyPath: string): boolean {
  try {
    getTranslation(keyPath, 'en')
    getTranslation(keyPath, 'fr')
    return true
  } catch {
    return false
  }
}

/**
 * Get all available translation keys (useful for debugging)
 */
export function getAvailableKeys(locale: Locale = 'en'): string[] {
  const translations = loadTranslations(locale)

  function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
    const keys: string[] = []

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key

      if (typeof value === 'object' && value !== null) {
        keys.push(...flattenKeys(value, fullKey))
      } else if (typeof value === 'string') {
        keys.push(fullKey)
      }
    }

    return keys
  }

  return flattenKeys(translations)
}

/**
 * Test utility to verify translation consistency across locales
 */
export function verifyTranslationConsistency(): {
  missing: string[]
  valid: string[]
} {
  const enKeys = new Set(getAvailableKeys('en'))
  const frKeys = new Set(getAvailableKeys('fr'))

  const missing: string[] = []
  const valid: string[] = []

  for (const key of enKeys) {
    if (frKeys.has(key)) {
      valid.push(key)
    } else {
      missing.push(`FR missing: ${key}`)
    }
  }

  for (const key of frKeys) {
    if (!enKeys.has(key)) {
      missing.push(`EN missing: ${key}`)
    }
  }

  return { missing, valid }
}
