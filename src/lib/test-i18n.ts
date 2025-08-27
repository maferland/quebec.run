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

// ---- Shared types & guards ----
type AnyObject = Record<string | number | symbol, unknown>

function isObjectRecord(v: unknown): v is AnyObject {
  return v !== null && typeof v === 'object'
}

// ---- getNestedValue ----
/**
 * Resolve a dot-path (e.g., "calendar.title" or "items.0.label") into a string.
 * - Safely narrows before indexing (works with `unknown`).
 * - Treats numeric segments as array indices when present (e.g., "0").
 * - Throws if the path is missing or does not resolve to a string.
 */
export function getNestedValue(obj: unknown, keyPath: string): string {
  const keys = keyPath.split('.')
  let value: unknown = obj

  for (const rawKey of keys) {
    const key: string | number = Number.isInteger(Number(rawKey))
      ? Number(rawKey)
      : rawKey

    if (isObjectRecord(value) && key in value) {
      value = (value as AnyObject)[key]
    } else {
      throw new Error(
        `Translation key "${keyPath}" not found (stopped at "${rawKey}")`
      )
    }
  }

  if (typeof value === 'string') return value
  throw new Error(`Translation key "${keyPath}" does not resolve to a string`)
}

/**
 * Optional helper if you prefer a fallback instead of throwing.
 */
export function getNestedValueOrDefault(
  obj: unknown,
  keyPath: string,
  fallback: string
): string {
  try {
    return getNestedValue(obj, keyPath)
  } catch {
    return fallback
  }
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
 * Return all translation paths that resolve to string leaves.
 * The emitted keys are compatible with getNestedValue (numeric segments for arrays).
 */
export function getAvailableKeys(locale: Locale = 'en'): string[] {
  const translations: unknown = loadTranslations(locale)

  function flattenKeys(node: unknown, prefix = ''): string[] {
    // String leaf → record current path
    if (typeof node === 'string') {
      return prefix ? [prefix] : []
    }

    // Recurse into any object (includes arrays)
    if (isObjectRecord(node)) {
      const acc: string[] = []
      for (const [k, v] of Object.entries(node)) {
        const fullKey = prefix ? `${prefix}.${k}` : k
        acc.push(...flattenKeys(v, fullKey))
      }
      return acc
    }

    // Ignore non-string primitives/functions/etc.
    return []
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
