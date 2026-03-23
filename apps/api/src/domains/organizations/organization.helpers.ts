import type {
  FeatureFlagKey,
  FeatureFlagsDto,
  OrganizationDto,
} from "@caseai-connect/api-contracts"
import type { FeatureFlag } from "../feature-flags/feature-flag.entity"
import type { MembershipRole } from "./memberships/organization-membership.entity"
import type { Organization } from "./organization.entity"

export function toDto({
  organization,
  role,
}: {
  organization: Organization
  role: MembershipRole
}): OrganizationDto {
  return {
    id: organization.id,
    name: organization.name,
    role,
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
