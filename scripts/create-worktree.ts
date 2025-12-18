#!/usr/bin/env tsx

import { execSync } from 'child_process'
import {
  existsSync,
  copyFileSync,
  appendFileSync,
  mkdirSync,
  readFileSync,
} from 'fs'
import { resolve } from 'path'

const REPO_ROOT = resolve(__dirname, '..')
const WORKTREES_DIR = resolve(REPO_ROOT, '.worktrees')
const MAIN_ENV_FILE = resolve(REPO_ROOT, '.env')

function validateBranchName(branchName: string): void {
  if (!branchName) {
    throw new Error('Branch name is required')
  }
  if (/[\s<>:"|?*]/.test(branchName)) {
    throw new Error('Branch name contains invalid characters')
  }
}

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

function getDatabaseUrl(branchName: string): {
  databaseUrl: string
  testDatabaseUrl: string
  dbName: string
} {
  const envContent = readFileSync(MAIN_ENV_FILE, 'utf-8')
  const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/)

  if (!dbUrlMatch) {
    throw new Error('DATABASE_URL not found in .env')
  }

  const mainDbUrl = dbUrlMatch[1]
  const urlParts = mainDbUrl.split('/')
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

async function main() {
  const branchName = process.argv[2]

  try {
    // Validate input
    validateBranchName(branchName)

    const worktreePath = resolve(WORKTREES_DIR, branchName)

    // Check if worktree already exists
    if (existsSync(worktreePath)) {
      throw new Error(`Worktree already exists at ${worktreePath}`)
    }

    // Check if main .env exists
    if (!existsSync(MAIN_ENV_FILE)) {
      console.warn('⚠️  Warning: Main .env file not found, skipping copy')
    }

    console.log(`Creating worktree for branch: ${branchName}`)

    // Create .worktrees directory if needed
    if (!existsSync(WORKTREES_DIR)) {
      mkdirSync(WORKTREES_DIR, { recursive: true })
    }

    // Check if branch already exists
    const fullBranchName = `maferland/${branchName}`
    let branchExists = false
    try {
      exec(`git rev-parse --verify ${fullBranchName}`)
      branchExists = true
      console.log(`✓ Branch ${fullBranchName} already exists, checking it out`)
    } catch {
      console.log(`✓ Creating new branch ${fullBranchName}`)
    }

    // Create git worktree (with or without -b depending on branch existence)
    if (branchExists) {
      exec(`git worktree add ${worktreePath} ${fullBranchName}`)
    } else {
      exec(`git worktree add ${worktreePath} -b ${fullBranchName}`)
    }
    console.log(`✓ Worktree created at ${worktreePath}`)

    // Copy .env if exists
    if (existsSync(MAIN_ENV_FILE)) {
      const worktreeEnvFile = resolve(worktreePath, '.env')
      copyFileSync(MAIN_ENV_FILE, worktreeEnvFile)
      console.log(`✓ Copied .env from main`)
    }

    // Generate random port suffix (01-99)
    console.log('Assigning ports...')
    const randomSuffix = String(Math.floor(Math.random() * 99) + 1).padStart(
      2,
      '0'
    )
    const devPort = parseInt(`60${randomSuffix}`, 10)
    const storybookPort = parseInt(`61${randomSuffix}`, 10)

    // Setup database
    console.log('Setting up database...')
    const { databaseUrl, testDatabaseUrl, dbName } = getDatabaseUrl(branchName)

    // Create database
    try {
      exec(
        `psql -U marc-antoine.ferland -d postgres -c "CREATE DATABASE \\"${dbName}\\";"`
      )
      console.log(`✓ Created database: ${dbName}`)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('already exists')) {
        console.log(`✓ Database already exists: ${dbName}`)
      } else if (
        message.includes('No such file or directory') ||
        message.includes('connection to server')
      ) {
        console.log(`⚠️  PostgreSQL not running, attempting to start...`)
        try {
          exec('brew services restart postgresql@16')
          console.log(`✓ PostgreSQL restarted`)
          // Retry database creation
          exec(
            `psql -U marc-antoine.ferland -d postgres -c "CREATE DATABASE \\"${dbName}\\";"`
          )
          console.log(`✓ Created database: ${dbName}`)
        } catch (retryError: unknown) {
          const retryMessage =
            retryError instanceof Error
              ? retryError.message
              : String(retryError)
          if (retryMessage.includes('already exists')) {
            console.log(`✓ Database already exists: ${dbName}`)
          } else {
            console.warn(`⚠️  Warning: Database creation failed after restart`)
            console.warn(
              `   You may need to create database manually: ${dbName}`
            )
          }
        }
      } else {
        console.warn(`⚠️  Warning: Database creation failed: ${message}`)
        console.warn(`   You may need to create database manually: ${dbName}`)
      }
    }

    // Append port config and database URL to .env
    const worktreeEnvFile = resolve(worktreePath, '.env')
    const envContent = `
# Worktree-specific overrides
PORT=${devPort}
STORYBOOK_PORT=${storybookPort}
DATABASE_URL="${databaseUrl}"
TEST_DATABASE_URL="${testDatabaseUrl}"
`
    appendFileSync(worktreeEnvFile, envContent)
    console.log(`✓ Updated .env with ports and database`)

    // Run bun install
    console.log('Running bun install...')
    exec('bun install', worktreePath)
    console.log(`✓ bun install complete`)

    // Run migrations
    console.log('Running database migrations...')
    try {
      exec('bun prisma migrate deploy', worktreePath)
      console.log(`✓ Migrations complete`)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`⚠️  Warning: Migration failed: ${message}`)
      console.warn(
        `   Run migrations manually: cd ${worktreePath} && bun prisma migrate deploy`
      )
    }

    // Seed database
    console.log('Seeding database...')
    try {
      exec('bun run db:seed', worktreePath)
      console.log(`✓ Database seeded`)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`⚠️  Warning: Seeding failed: ${message}`)
      console.warn(
        `   Run seed manually: cd ${worktreePath} && bun run db:seed`
      )
    }

    // Success message
    console.log('\n✨ Worktree setup complete!\n')
    console.log(`Branch: maferland/${branchName}`)
    console.log(`Path: ${worktreePath}`)
    console.log(`Database: ${dbName}`)
    console.log(`Dev server: http://localhost:${devPort}`)
    console.log(`Storybook: http://localhost:${storybookPort}`)
    console.log(`Mailhog: http://localhost:8025 (shared)`)
    console.log(`\nTo start working:`)
    console.log(`  cd ${worktreePath}`)
    console.log(`  bun run dev\n`)

    process.exit(0)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`\n❌ Error: ${message}\n`)
    process.exit(1)
  }
}

main()
