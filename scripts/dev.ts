#!/usr/bin/env bun
import { $ } from 'bun'

const port = Bun.env.PORT || '3000'
const emailPort = Bun.env.EMAIL_SERVER_PORT || '1025'

await Promise.all([
  $`docker compose up -d`.catch(() => console.log('Docker already running')),
  $`mailhog -smtp-bind-addr :${emailPort}`,
  $`next dev --turbopack --port ${port}`,
])
