import type {
  FeatureFlagKey,
  FeatureFlagsDto,
  OrganizationDto,
} from "@caseai-connect/api-contracts"
import type { FeatureFlag } from "../feature-flags/feature-flag.entity"
import type { Organization } from "./organization.entity"

export function toDto(organization: Organization): OrganizationDto {
  return {
    id: organization.id,
    name: organization.name,
    featureFlags: toFeatureFlagsDto(organization.featureFlags),
  }
}

function toFeatureFlagsDto(featureFlags: FeatureFlag[]): FeatureFlagsDto {
  return (
    featureFlags
      ?.filter((flag) => flag.enabled)
      .map((flag) => flag.featureFlagKey as FeatureFlagKey) ?? []
  )
}
