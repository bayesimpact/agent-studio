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
}
export default nestConfig
