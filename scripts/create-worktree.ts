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
import { findFreePort } from './find-free-port'

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

    // Create git worktree
    exec(`git worktree add ${worktreePath} -b maferland/${branchName}`)
    console.log(`✓ Worktree created at ${worktreePath}`)

    // Copy .env if exists
    if (existsSync(MAIN_ENV_FILE)) {
      const worktreeEnvFile = resolve(worktreePath, '.env')
      copyFileSync(MAIN_ENV_FILE, worktreeEnvFile)
      console.log(`✓ Copied .env from main`)
    }

    // Find free ports
    console.log('Finding available ports...')
    const devPort = await findFreePort(3001, 4000)
    const storybookPort = await findFreePort(6007, 7000)

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
      } else {
        throw error
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

    // Run npm install
    console.log('Running npm install...')
    exec('npm install', worktreePath)
    console.log(`✓ npm install complete`)

    // Run migrations
    console.log('Running database migrations...')
    exec('npx prisma migrate deploy', worktreePath)
    console.log(`✓ Migrations complete`)

    // Success message
    console.log('\n✨ Worktree setup complete!\n')
    console.log(`Branch: maferland/${branchName}`)
    console.log(`Path: ${worktreePath}`)
    console.log(`Database: ${dbName}`)
    console.log(`Dev server: http://localhost:${devPort}`)
    console.log(`Storybook: http://localhost:${storybookPort}`)
    console.log(`\nTo start working:`)
    console.log(`  cd ${worktreePath}`)
    console.log(`  npm run dev\n`)

    process.exit(0)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`\n❌ Error: ${message}\n`)
    process.exit(1)
  }
}

main()
