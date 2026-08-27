#!/usr/bin/env tsx

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve } from 'path'
import {
  databaseNameFromUrl,
  readEnvValueFromFile,
  resolveDropDatabaseName,
  resolveDropDatabaseNames,
} from './worktree-env'

const REPO_ROOT = resolve(__dirname, '..')
const WORKTREES_DIR = resolve(REPO_ROOT, '.worktrees')
const MAIN_ENV_FILE = resolve(REPO_ROOT, '.env')

function exec(command: string, cwd?: string): string {
  try {
    return execSync(command, {
      cwd: cwd || REPO_ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Command failed: ${command}\n${message}`)
  }
}

function getDatabaseName(envFile: string, key: string): string | null {
  const databaseUrl = readEnvValueFromFile(envFile, key)

  return databaseUrl ? databaseNameFromUrl(databaseUrl) : null
}

async function main() {
  const branchName = process.argv[2]

  if (!branchName) {
    console.error('Usage: npm run remove-worktree <branch-name>')
    process.exit(1)
  }

  try {
    const worktreePath = resolve(WORKTREES_DIR, branchName)

    // Check if worktree exists
    if (!existsSync(worktreePath)) {
      throw new Error(`Worktree not found at ${worktreePath}`)
    }

    // Get database names before removing
    const worktreeEnvFile = resolve(worktreePath, '.env')
    const worktreeDbName = getDatabaseName(worktreeEnvFile, 'DATABASE_URL')
    const mainDbName = getDatabaseName(MAIN_ENV_FILE, 'DATABASE_URL')
    const dbName = resolveDropDatabaseName(worktreeDbName, mainDbName)
    const dropNames = resolveDropDatabaseNames(
      {
        db: worktreeDbName,
        testDb: getDatabaseName(worktreeEnvFile, 'TEST_DATABASE_URL'),
      },
      {
        db: mainDbName,
        testDb: getDatabaseName(MAIN_ENV_FILE, 'TEST_DATABASE_URL'),
      }
    )

    if (worktreeDbName && !dbName) {
      throw new Error(
        `Worktree .env still points at the main database "${worktreeDbName}" - it never got its own.\n` +
          `Refusing to drop it. Remove the worktree by hand once you are sure:\n` +
          `  git worktree remove ${worktreePath} --force`
      )
    }

    console.log(`Removing worktree: ${branchName}`)

    // Remove git worktree
    exec(`git worktree remove ${worktreePath} --force`)
    console.log(`✓ Removed worktree`)

    // Drop both databases: the test one is created alongside and was orphaned
    for (const name of dropNames) {
      try {
        exec(
          `psql -U marc-antoine.ferland -d postgres -c "DROP DATABASE IF EXISTS \\"${name}\\";"`
        )
        console.log(`✓ Dropped database: ${name}`)
      } catch {
        console.warn(`⚠️  Warning: Could not drop database ${name}`)
      }
    }

    // Delete branch
    try {
      exec(`git branch -D maferland/${branchName}`)
      console.log(`✓ Deleted branch: maferland/${branchName}`)
    } catch {
      console.warn(
        `⚠️  Warning: Could not delete branch maferland/${branchName}`
      )
    }

    console.log('\n✨ Worktree cleanup complete!\n')
    process.exit(0)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`\n❌ Error: ${message}\n`)
    process.exit(1)
  }
}

main()
