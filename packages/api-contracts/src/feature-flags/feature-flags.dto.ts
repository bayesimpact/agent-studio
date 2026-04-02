export const FeatureFlags = [
  {
    key: "evaluation",
    description:
      "Evaluate the performance of your agents with a set of pre-defined evaluation tasks",
  },
  {
    key: "sources_tool",
    description: "Access and utilize the sources tool.",
  },
  {
    key: "gemma",
    description: "Access and utilize gemma models.",
  },
  {
    key: "bayes_social_mcp",
    description: "Connect Bayes social MCP server as a workspace source.",
  },
  {
    key: "project-analytics",
    description: "View project-level analytics and usage charts in the studio.",
  },
] as const
export type FeatureFlagKey = (typeof FeatureFlags)[number]["key"]
export type FeatureFlagsDto = FeatureFlagKey[]
