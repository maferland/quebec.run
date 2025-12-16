#!/usr/bin/env tsx

import { execSync } from 'child_process'

interface Deployment {
  id: number
  environment: string
  created_at: string
}

async function prunePreviewDeployments() {
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
  const productionDeployments = deployments.filter(
    (d) => d.environment === 'Production'
  )

  console.log(`\nFound ${deployments.length} total deployments:`)
  console.log(`  - Production: ${productionDeployments.length} (keeping)`)
  console.log(`  - Preview: ${previewDeployments.length} (deleting)\n`)

  if (previewDeployments.length === 0) {
    console.log('No Preview deployments to delete.')
    return
  }

  console.log('Starting deletion...')
  let deleted = 0

  for (const deployment of previewDeployments) {
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
        console.log(`Deleted ${deleted}/${previewDeployments.length}...`)
      }
    } catch (error) {
      console.error(`Failed to delete deployment ${deployment.id}:`, error)
    }
  }

  console.log(`\n✅ Deleted ${deleted} Preview deployments`)
  console.log(`✅ Kept ${productionDeployments.length} Production deployments`)
}

prunePreviewDeployments().catch(console.error)
