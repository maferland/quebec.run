import { createServer } from 'net'

async function findFreePort(
  startPort: number,
  maxPort: number
): Promise<number> {
  for (let port = startPort; port <= maxPort; port++) {
    if (await isPortAvailable(port)) {
      return port
    }
  }
  throw new Error(`No free port found in range ${startPort}-${maxPort}`)
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()

    server.once('error', () => {
      resolve(false)
    })

    server.once('listening', () => {
      server.close()
      resolve(true)
    })

    server.listen(port, '127.0.0.1')
  })
}

export { findFreePort }

// CLI usage
if (require.main === module) {
  const startPort = parseInt(process.argv[2] || '3001', 10)
  const maxPort = parseInt(process.argv[3] || '4000', 10)

  findFreePort(startPort, maxPort)
    .then((port) => {
      console.log(port)
      process.exit(0)
    })
    .catch((err) => {
      console.error(err.message)
      process.exit(1)
    })
}
