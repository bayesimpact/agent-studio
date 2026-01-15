import { resolve } from "node:path"
import { config as dotenvConfig } from "dotenv"

// Load .env.test file for tests
dotenvConfig({ path: resolve(__dirname, ".env.test") })

export const nestConfig = {
  collectCoverage: true,
  coverageProvider: "v8",
  moduleFileExtensions: ["js", "ts", "json"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/../jest.setup.ts"],
}
export default nestConfig
