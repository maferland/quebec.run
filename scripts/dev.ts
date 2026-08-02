#!/usr/bin/env bun
import { $ } from 'bun'

const port = Bun.env.PORT || '3000'
const mailhogWebPort = Bun.env.MAILHOG_WEB_PORT || '8025'
const mailhogSmtpPort = Bun.env.MAILHOG_SMTP_PORT || '1025'

const startDocker = async () => {
  try {
    await $`docker compose up -d`
  } catch {
    console.log(
      '🐳 docker compose did not start, looking for a running Mailhog'
    )
  }
}

const isMailhogListening = async () => {
  try {
    await fetch(`http://localhost:${mailhogWebPort}/api/v2/messages`)
    return true
  } catch {
    return false
  }
}

const waitForMailhog = async () => {
  for (let attempt = 0; attempt < 10; attempt++) {
    if (await isMailhogListening()) return true
    await Bun.sleep(500)
  }
  return false
}

const startMailhog = async () => {
  await startDocker()

  if (await waitForMailhog()) {
    console.log(`📬 Mailhog running on port ${mailhogWebPort}`)
    return
  }

  console.log(
    `📬 Starting Mailhog on SMTP ${mailhogSmtpPort}, web ${mailhogWebPort}...`
  )
  try {
    await $`mailhog -smtp-bind-addr :${mailhogSmtpPort} -ui-bind-addr :${mailhogWebPort} -api-bind-addr :${mailhogWebPort}`
  } catch {
    console.log(
      `📬 No Mailhog on port ${mailhogWebPort}. Check docker compose, or install the mailhog binary. Magic-link sign-in won't work until it's up.`
    )
  }
}

const startNext = async () => {
  console.log(`🚀 Starting Next.js on port ${port}...`)
  await $`next dev --turbopack --port ${port}`
}

await Promise.all([startMailhog(), startNext()])
