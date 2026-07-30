import { mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'
import { describe, expect, it } from 'vitest'
import {
  applyEnvOverrides,
  databaseNameFromUrl,
  deriveWorktreeDatabaseUrls,
  readEnvValue,
  readEnvValueFromFile,
} from './worktree-env'

const MAIN_ENV = `# Main env
DATABASE_URL="postgresql://user@localhost:5432/quebec.run?schema=public"
TEST_DATABASE_URL="postgresql://user@localhost:5432/quebec.run_test?schema=public"
NEXTAUTH_SECRET="secret"
`

const OVERRIDES = {
  PORT: '6042',
  STORYBOOK_PORT: '6142',
  DATABASE_URL:
    'postgresql://user@localhost:5432/quebec.run_feat?schema=public',
  TEST_DATABASE_URL:
    'postgresql://user@localhost:5432/quebec.run_feat_test?schema=public',
}

const countKey = (content: string, key: string) =>
  content.split('\n').filter((line) => line.startsWith(`${key}=`)).length

describe('readEnvValue', () => {
  it.each([
    ['quoted', 'DATABASE_URL="postgres://a/db"', 'postgres://a/db'],
    ['unquoted', 'DATABASE_URL=postgres://a/db', 'postgres://a/db'],
    ['single quoted', "DATABASE_URL='postgres://a/db'", 'postgres://a/db'],
    ['exported', 'export DATABASE_URL="postgres://a/db"', 'postgres://a/db'],
    [
      'trailing comment',
      'DATABASE_URL=postgres://a/db # local',
      'postgres://a/db',
    ],
  ])('reads a %s value', (_label, line, expected) => {
    expect(readEnvValue(line, 'DATABASE_URL')).toBe(expected)
  })

  it('returns null for a missing key', () => {
    expect(readEnvValue(MAIN_ENV, 'MISSING')).toBeNull()
  })

  it('ignores commented-out assignments', () => {
    const content = `#DATABASE_URL="postgres://a/commented"
DATABASE_URL="postgres://a/real"`
    expect(readEnvValue(content, 'DATABASE_URL')).toBe('postgres://a/real')
  })

  it('does not confuse TEST_DATABASE_URL with DATABASE_URL', () => {
    expect(readEnvValue(MAIN_ENV, 'DATABASE_URL')).toBe(
      'postgresql://user@localhost:5432/quebec.run?schema=public'
    )
  })

  it('resolves duplicates to the last value, like dotenv', () => {
    const duplicated = `DATABASE_URL="postgres://a/first"
DATABASE_URL="postgres://a/second"
DATABASE_URL="postgres://a/third"`
    expect(readEnvValue(duplicated, 'DATABASE_URL')).toBe('postgres://a/third')
  })
})

describe('readEnvValueFromFile', () => {
  it('reads the value from a file on disk', () => {
    const dir = mkdtempSync(join(tmpdir(), 'worktree-env-'))
    const envFile = resolve(dir, '.env')
    writeFileSync(envFile, applyEnvOverrides(MAIN_ENV, OVERRIDES))

    expect(readEnvValueFromFile(envFile, 'DATABASE_URL')).toBe(
      OVERRIDES.DATABASE_URL
    )
  })

  it('returns null when the file is missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'worktree-env-'))

    expect(
      readEnvValueFromFile(resolve(dir, '.env'), 'DATABASE_URL')
    ).toBeNull()
  })
})

describe('applyEnvOverrides', () => {
  it('writes exactly one assignment per overridden key', () => {
    const result = applyEnvOverrides(MAIN_ENV, OVERRIDES)

    expect(countKey(result, 'DATABASE_URL')).toBe(1)
    expect(countKey(result, 'TEST_DATABASE_URL')).toBe(1)
    expect(countKey(result, 'PORT')).toBe(1)
    expect(countKey(result, 'STORYBOOK_PORT')).toBe(1)
  })

  it('keeps untouched keys and comments', () => {
    const result = applyEnvOverrides(MAIN_ENV, OVERRIDES)

    expect(result).toContain('# Main env')
    expect(readEnvValue(result, 'NEXTAUTH_SECRET')).toBe('secret')
  })

  it('applies the override values', () => {
    const result = applyEnvOverrides(MAIN_ENV, OVERRIDES)

    expect(readEnvValue(result, 'DATABASE_URL')).toBe(OVERRIDES.DATABASE_URL)
    expect(readEnvValue(result, 'TEST_DATABASE_URL')).toBe(
      OVERRIDES.TEST_DATABASE_URL
    )
    expect(readEnvValue(result, 'PORT')).toBe('6042')
  })

  it('stays at one assignment when applied to an already-overridden file', () => {
    const once = applyEnvOverrides(MAIN_ENV, OVERRIDES)
    const twice = applyEnvOverrides(once, {
      ...OVERRIDES,
      DATABASE_URL: 'postgresql://user@localhost:5432/other?schema=public',
    })

    expect(countKey(twice, 'DATABASE_URL')).toBe(1)
    expect(readEnvValue(twice, 'DATABASE_URL')).toBe(
      'postgresql://user@localhost:5432/other?schema=public'
    )
  })
})

describe('databaseNameFromUrl', () => {
  it.each([
    ['postgresql://user@localhost:5432/quebec.run?schema=public', 'quebec.run'],
    ['postgresql://user@localhost:5432/quebec.run', 'quebec.run'],
  ])('extracts the name from %s', (url, expected) => {
    expect(databaseNameFromUrl(url)).toBe(expected)
  })
})

describe('deriveWorktreeDatabaseUrls', () => {
  it('derives names from the source database', () => {
    const result = deriveWorktreeDatabaseUrls(
      'postgresql://user@localhost:5432/quebec.run?schema=public',
      'my-feature'
    )

    expect(result).toEqual({
      databaseUrl:
        'postgresql://user@localhost:5432/quebec.run_my_feature?schema=public',
      testDatabaseUrl:
        'postgresql://user@localhost:5432/quebec.run_my_feature_test?schema=public',
      dbName: 'quebec.run_my_feature',
    })
  })

  it('defaults the schema when the source URL has none', () => {
    const result = deriveWorktreeDatabaseUrls(
      'postgresql://user@localhost:5432/quebec.run',
      'feat'
    )

    expect(result.databaseUrl).toBe(
      'postgresql://user@localhost:5432/quebec.run_feat?schema=public'
    )
  })

  // The bug from #81: create-worktree read the first DATABASE_URL, so running
  // it inside a worktree branched off the outer main database.
  it('branches off the active database when run from inside a worktree', () => {
    const nestedEnv = applyEnvOverrides(MAIN_ENV, OVERRIDES)
    const activeUrl = readEnvValue(nestedEnv, 'DATABASE_URL')

    expect(activeUrl).toBe(OVERRIDES.DATABASE_URL)
    expect(deriveWorktreeDatabaseUrls(activeUrl!, 'nested').dbName).toBe(
      'quebec.run_feat_nested'
    )
  })

  it('branches off the active database even with legacy duplicate keys', () => {
    const legacyEnv = `${MAIN_ENV}
# Worktree-specific overrides
DATABASE_URL="${OVERRIDES.DATABASE_URL}"
`
    const activeUrl = readEnvValue(legacyEnv, 'DATABASE_URL')

    expect(deriveWorktreeDatabaseUrls(activeUrl!, 'nested').dbName).toBe(
      'quebec.run_feat_nested'
    )
  })
})
