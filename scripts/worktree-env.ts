/**
 * Shared .env reading/writing for the worktree scripts.
 *
 * create-worktree and remove-worktree used to each roll their own
 * DATABASE_URL regex with opposite semantics (first match vs last match).
 * Both now go through readEnvValue, which resolves duplicates the way
 * dotenv does: last assignment wins.
 */

import { existsSync, readFileSync } from 'fs'

const ENV_LINE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/

const OVERRIDE_HEADER = '# Worktree-specific overrides'

function parseValue(raw: string): string {
  const value = raw.trim()
  const quote = value[0]
  if (quote === '"' || quote === "'") {
    // Anything past the closing quote is a trailing comment
    const closingQuote = value.indexOf(quote, 1)
    if (closingQuote > 0) {
      return value.slice(1, closingQuote)
    }
  }
  // Unquoted values can carry a trailing comment
  return value.split('#')[0].trim()
}

function envKey(line: string): string | null {
  const match = ENV_LINE.exec(line)
  return match ? match[1] : null
}

/**
 * Value a dotenv-based loader would see for `key`. Duplicate assignments
 * resolve to the last one, so a worktree override wins over the copied
 * main value. Returns null when the key is absent.
 */
export function readEnvValue(envContent: string, key: string): string | null {
  let value: string | null = null

  for (const line of envContent.split('\n')) {
    const match = ENV_LINE.exec(line)
    if (match && match[1] === key) {
      value = parseValue(match[2])
    }
  }

  return value
}

/** readEnvValue against a file path, tolerating a missing file. */
export function readEnvValueFromFile(
  envFile: string,
  key: string
): string | null {
  if (!existsSync(envFile)) {
    return null
  }
  return readEnvValue(readFileSync(envFile, 'utf-8'), key)
}

/**
 * Replace the given keys instead of appending duplicates: drop every
 * existing assignment, then write the overrides once at the end.
 */
export function applyEnvOverrides(
  envContent: string,
  overrides: Record<string, string>
): string {
  const overridden = Object.keys(overrides)
  const kept = envContent
    .split('\n')
    .filter((line) => {
      if (line.trim() === OVERRIDE_HEADER) {
        return false
      }
      const key = envKey(line)
      return key === null || !overridden.includes(key)
    })
    .join('\n')
    .replace(/\n+$/, '')

  const block = overridden.map((key) => `${key}="${overrides[key]}"`).join('\n')

  return `${kept}\n\n${OVERRIDE_HEADER}\n${block}\n`
}

export function databaseChildEnv(
  databaseUrl: string,
  testDatabaseUrl: string
): Record<string, string> {
  return { DATABASE_URL: databaseUrl, TEST_DATABASE_URL: testDatabaseUrl }
}

/** Database name from a postgres URL: last path segment, minus query string. */
export function databaseNameFromUrl(databaseUrl: string): string {
  const lastSegment = databaseUrl.split('/').pop() ?? ''
  return lastSegment.split('?')[0]
}

/**
 * Database name safe to drop when tearing down a worktree, or null to
 * refuse. A worktree whose .env was never overridden still points at the
 * main database, and dropping that would take the developer's data with it.
 */
export function resolveDropDatabaseName(
  worktreeDbName: string | null,
  mainDbName: string | null
): string | null {
  return worktreeDbName === mainDbName ? null : worktreeDbName
}

type WorktreeDatabases = { db: string | null; testDb: string | null }

/** Every database a worktree owns, each guarded against dropping main's. */
export function resolveDropDatabaseNames(
  worktree: WorktreeDatabases,
  main: WorktreeDatabases
): string[] {
  return [
    resolveDropDatabaseName(worktree.db, main.db),
    resolveDropDatabaseName(worktree.testDb, main.testDb),
  ].filter((name): name is string => name !== null)
}

/**
 * Worktree database URLs derived from the URL currently in effect, so
 * creating a worktree from inside another worktree branches off that
 * worktree's database rather than the main one.
 */
export function deriveWorktreeDatabaseUrls(
  sourceDatabaseUrl: string,
  branchName: string
): { databaseUrl: string; testDatabaseUrl: string; dbName: string } {
  const urlParts = sourceDatabaseUrl.split('/')
  const dbNameWithSchema = urlParts[urlParts.length - 1]
  const baseDbName = dbNameWithSchema.split('?')[0]

  // Create unique db name: quebec.run_branch-name
  const sanitizedBranch = branchName.replace(/[^a-z0-9_]/gi, '_')
  const newDbName = `${baseDbName}_${sanitizedBranch}`
  const newTestDbName = `${newDbName}_test`

  // Replace database name in URL
  const baseUrl = urlParts.slice(0, -1).join('/')
  const schema = dbNameWithSchema.includes('?')
    ? '?' + dbNameWithSchema.split('?')[1]
    : '?schema=public'

  return {
    databaseUrl: `${baseUrl}/${newDbName}${schema}`,
    testDatabaseUrl: `${baseUrl}/${newTestDbName}${schema}`,
    dbName: newDbName,
  }
}
