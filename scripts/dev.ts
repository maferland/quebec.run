#!/usr/bin/env bun
import { $ } from 'bun'

const port = Bun.env.PORT || '3000'

const startDocker = async () => {
  try {
    await $`docker compose up -d`
  } catch {
    console.log('🐳 Docker already running')
  }
}

const startMailhog = async () => {
  try {
    await fetch('http://localhost:8025/api/v2/messages')
    console.log('📬 Mailhog already running')
  } catch {
    console.log('📬 Starting Mailhog...')
    await $`mailhog`
  }
}

const startNext = async () => {
  console.log(`🚀 Starting Next.js on port ${port}...`)
  await $`next dev --turbopack --port ${port}`
}

await Promise.all([startDocker(), startMailhog(), startNext()])
