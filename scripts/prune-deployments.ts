#!/usr/bin/env tsx

import { execSync } from 'child_process'

interface Deployment {
  id: number
  environment: string
  created_at: string
}

const KEEP_PRODUCTION_COUNT = 5

async function pruneDeployments() {
  console.log('Fetching all deployments...')

  // Get all deployments (paginated returns multiple arrays, flatten them)
  const deploymentsJson = execSync(
    'gh api repos/maferland/quebec.run/deployments --paginate --jq ".[]"',
    { encoding: 'utf-8' }
  )

  // Split by newlines and parse each JSON object
  const deployments: Deployment[] = deploymentsJson
    .trim()
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line))

  const previewDeployments = deployments.filter(
    (d) => d.environment === 'Preview'
  )
  const productionDeployments = deployments
    .filter((d) => d.environment === 'Production')
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

  const productionToKeep = productionDeployments.slice(0, KEEP_PRODUCTION_COUNT)
  const productionToDelete = productionDeployments.slice(KEEP_PRODUCTION_COUNT)

  console.log(`\nFound ${deployments.length} total deployments:`)
  console.log(
    `  - Production: ${productionDeployments.length} (keeping ${productionToKeep.length}, deleting ${productionToDelete.length})`
  )
  console.log(`  - Preview: ${previewDeployments.length} (deleting all)\n`)

  const deploymentsToDelete = [...previewDeployments, ...productionToDelete]

  if (deploymentsToDelete.length === 0) {
    console.log('No deployments to delete.')
    return
  }

  console.log('Starting deletion...')
  let deleted = 0

  for (const deployment of deploymentsToDelete) {
    try {
      // Set deployment to inactive state first
      execSync(
        `gh api -X POST repos/maferland/quebec.run/deployments/${deployment.id}/statuses -f state=inactive`,
        { stdio: 'pipe' }
      )

      // Delete the deployment
      execSync(
        `gh api -X DELETE repos/maferland/quebec.run/deployments/${deployment.id}`,
        { stdio: 'pipe' }
      )

      deleted++
      if (deleted % 10 === 0) {
        console.log(`Deleted ${deleted}/${deploymentsToDelete.length}...`)
      }
    } catch (error) {
      console.error(`Failed to delete deployment ${deployment.id}:`, error)
    }
  }

  console.log(`\n✅ Deleted ${deleted} deployments`)
  console.log(`✅ Kept ${productionToKeep.length} Production deployments`)
}

pruneDeployments().catch(console.error)
