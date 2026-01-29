// This file runs before each test file

import { resolve } from "node:path"
import { config as dotenvConfig } from "dotenv"

// Explicitly load .env.test to ensure it takes precedence
dotenvConfig({ path: resolve(__dirname, ".env.test"), override: true })
