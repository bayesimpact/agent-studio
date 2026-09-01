const nestConfig = require("./jest.config.ts").default
export default {
  ...nestConfig,

  moduleFileExtensions: ["ts", "js", "json"],
  transformIgnorePatterns: ["/node_modules/(?!langfuse-core/)", "\\.pnp\\.[^\\\\]+$"],
}
