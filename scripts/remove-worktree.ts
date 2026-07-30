#!/usr/bin/env tsx

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { databaseNameFromUrl, readEnvValueFromFile } from './worktree-env'

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

function getDatabaseName(envFile: string): string | null {
  const databaseUrl = readEnvValueFromFile(envFile, 'DATABASE_URL')

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

    // Get database name before removing
    const dbName = getDatabaseName(resolve(worktreePath, '.env'))
    const mainDbName = getDatabaseName(MAIN_ENV_FILE)

    // A worktree whose .env was never overridden still points at the main
    // database, and dropping that would take the developer's data with it
    if (dbName && dbName === mainDbName) {
      throw new Error(
        `Worktree .env still points at the main database "${dbName}" - it never got its own.\n` +
          `Refusing to drop it. Remove the worktree by hand once you are sure:\n` +
          `  git worktree remove ${worktreePath} --force`
      )
    }

    console.log(`Removing worktree: ${branchName}`)

    // Remove git worktree
    exec(`git worktree remove ${worktreePath} --force`)
    console.log(`✓ Removed worktree`)

    // Drop database if found
    if (dbName) {
      try {
        exec(
          `psql -U marc-antoine.ferland -d postgres -c "DROP DATABASE IF EXISTS \\"${dbName}\\";"`
        )
        console.log(`✓ Dropped database: ${dbName}`)
      } catch {
        console.warn(`⚠️  Warning: Could not drop database ${dbName}`)
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
