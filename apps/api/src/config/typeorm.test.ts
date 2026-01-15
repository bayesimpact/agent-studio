import * as process from "node:process"

import { config as dotenvConfig } from "dotenv"
import { DataSource, type DataSourceOptions } from "typeorm"

// Load .env.test for test database migrations
dotenvConfig({ path: ".env.test" })

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
