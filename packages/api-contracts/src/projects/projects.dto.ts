import type { FeatureFlagsDto } from "../feature-flags/feature-flags.dto"
import type { TimeType } from "../generic"

export type ProjectDto = {
  id: string
  name: string
  organizationId: string
  createdAt: TimeType
  updatedAt: TimeType
  featureFlags: FeatureFlagsDto
  agentCategories: ProjectAgentCategoryDto[]
}

export type ProjectAgentCategoryDto = {
  id: string
  name: string
}
