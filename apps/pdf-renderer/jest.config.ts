import type { Config } from "jest"

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  testEnvironment: "node",
  // Rendering specs spawn a real pdf rasterization subprocess per request.
  testTimeout: 30_000,
}

export default config
