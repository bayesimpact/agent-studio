import { createInterface } from "node:readline"
import type { Logger } from "@nestjs/common"
import { config as dotenvConfig } from "dotenv"

const envPath = process.env.DOTENV_CONFIG_PATH
if (envPath) {
  dotenvConfig({ path: envPath, override: true })
}

export function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

export async function confirmDatabaseTarget(logger: Logger): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  const target =
    databaseUrl ??
    `${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`
  logger.warn(`Target database: ${target}`)
  const answer = await ask("Do you want to proceed? (yes/no): ")
  if (answer.toLowerCase() !== "yes") {
    logger.log("Aborted by user.")
    process.exit(0)
  }
}
