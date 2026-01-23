import { resolve } from "node:path"
import { config as dotenvConfig } from "dotenv"

// Load .env.test file for tests
dotenvConfig({ path: resolve(__dirname, ".env.test") })

// Resolve path to api-contracts package
const apiContractsPath = resolve(__dirname, "../../packages/api-contracts/src")

export const nestConfig = {
  collectCoverage: true,
  coverageProvider: "v8",
  moduleFileExtensions: ["js", "ts", "json"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: [
    "**/*.(t|j)s",
    "!**/migrations/**",
    "!**/*.migration.ts",
    "!**/dto/**",
    "!**/*.dto.ts",
  ],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@caseai-connect/api-contracts$": `${apiContractsPath}/index.ts`,
    "^@caseai-connect/api-contracts/(.*)$": `${apiContractsPath}/$1`,
  },
  setupFilesAfterEnv: ["<rootDir>/../jest.setup.ts"],
}
export default nestConfig
