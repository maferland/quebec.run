#!/usr/bin/env tsx

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const REPO_ROOT = resolve(__dirname, '..')
const WORKTREES_DIR = resolve(REPO_ROOT, '.worktrees')

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

function getDatabaseName(worktreePath: string): string | null {
  const envFile = resolve(worktreePath, '.env')

  if (!existsSync(envFile)) {
    return null
  }

  const envContent = readFileSync(envFile, 'utf-8')
  // Match DATABASE_URL specifically (not TEST_DATABASE_URL) and get the last one (worktree override)
  const matches = envContent.matchAll(/^DATABASE_URL="[^"]*\/([^/?]+)/gm)
  const allMatches = Array.from(matches)

  if (allMatches.length === 0) {
    return null
  }

  // Return the last match (worktree-specific override)
  const lastMatch = allMatches[allMatches.length - 1]
  return lastMatch[1]
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

    console.log(`Removing worktree: ${branchName}`)

    // Get database name before removing
    const dbName = getDatabaseName(worktreePath)

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
