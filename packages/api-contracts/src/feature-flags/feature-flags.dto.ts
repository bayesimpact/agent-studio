export const FeatureFlags = [
  {
    key: "evaluation",
    description:
      "Evaluate the performance of your agents with a set of pre-defined evaluation tasks",
  },
] as const
export type FeatureFlagKey = (typeof FeatureFlags)[number]["key"]
export type FeatureFlagsDto = FeatureFlagKey[]
