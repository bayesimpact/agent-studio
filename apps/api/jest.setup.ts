// This file runs before each test file
// Ensure .env.test is loaded (already loaded in jest.config.ts, but this ensures it)

import { resolve } from "node:path"
import { config as dotenvConfig } from "dotenv"

// Explicitly load .env.test to ensure it takes precedence
dotenvConfig({ path: resolve(__dirname, ".env.test"), override: true })
