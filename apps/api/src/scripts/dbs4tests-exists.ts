import { availableParallelism, cpus } from "node:os"
import { Client } from "pg"

function getCpuCount(): number {
  return typeof availableParallelism === "function" ? availableParallelism() : cpus().length
}

export function resolveWorkerCount(): number {
  const envWorkers = Number(process.env.TEST_WORKERS)
  if (Number.isFinite(envWorkers) && envWorkers > 0) {
    return Math.floor(envWorkers)
  }
  return Math.max(1, Math.floor(getCpuCount() * 0.5))
}

export function parseWorkersArgument(): number | null {
  const matchingArgument = process.argv.find((argumentValue) =>
    argumentValue.startsWith("--workers="),
  )
  if (!matchingArgument) {
    return null
  }
  const numericValue = Number(matchingArgument.split("=")[1])
  return Number.isFinite(numericValue) && numericValue > 0 ? Math.floor(numericValue) : null
}

/** False whenever the answer cannot be established, so the caller falls back to prepare. */
export async function workerDatabasesExist(workerCount: number): Promise<boolean> {
  const baseDatabaseUrl = process.env.DATABASE_URL
  if (!baseDatabaseUrl) {
    return false
  }

  const baseDatabaseName = new URL(baseDatabaseUrl).pathname.replace(/^\//, "")
  if (!baseDatabaseName) {
    return false
  }

  const adminDatabaseUrl = new URL(process.env.TEST_ADMIN_DATABASE_URL ?? baseDatabaseUrl)
  adminDatabaseUrl.pathname = "/postgres"

  const expectedDatabaseNames = Array.from(
    { length: workerCount },
    (_, workerIndex) => `${baseDatabaseName}_w${workerIndex + 1}`,
  )

  const adminClient = new Client({ connectionString: adminDatabaseUrl.toString() })
  try {
    await adminClient.connect()
    const foundDatabases = await adminClient.query<{ datname: string }>(
      "SELECT datname FROM pg_database WHERE datname = ANY($1::text[])",
      [expectedDatabaseNames],
    )
    return foundDatabases.rowCount === expectedDatabaseNames.length
  } catch {
    return false
  } finally {
    await adminClient.end().catch(() => undefined)
  }
}
