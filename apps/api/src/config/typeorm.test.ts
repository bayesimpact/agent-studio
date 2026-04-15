import * as process from "node:process"

import { config as dotenvConfig } from "dotenv"
import { DataSource, type DataSourceOptions } from "typeorm"

dotenvConfig({ path: ".env.test", override: true, quiet: true })

let extra = {}
if (process.env.DATABASE_HOST?.startsWith("/cloudsql")) {
  extra = {
    socketPath: process.env.DATABASE_HOST,
  }
}

// DataSource for test database migrations
export const connectionSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: ["src/**/*.entity.ts"],
  migrations: ["src/migrations/*.ts"],
  logging: true,
  extra,
} as DataSourceOptions)
