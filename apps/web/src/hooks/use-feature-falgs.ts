import type { FeatureFlagKey } from "@caseai-connect/api-contracts"
import { selectCurrentOrganization } from "@/features/organizations/organizations.selectors"
import type { RootState } from "@/store"
import { useAppSelector } from "@/store/hooks"

function check(flags: FeatureFlagKey[], feature: FeatureFlagKey): boolean {
  return flags.some((flag) => flag === feature)
}

export function useFeatureFlags() {
  const org = useAppSelector(selectCurrentOrganization)
  return {
    hasFeature: (feature: FeatureFlagKey): boolean => check(org?.featureFlags || [], feature),
  }
}

export function hasFeatureOrThrow({
  state,
  feature,
}: {
  state: RootState
  feature: FeatureFlagKey
}): true {
  const organization = selectCurrentOrganization(state)
  if (!organization) throw new Error("No organization selected")
  const hasFeature = check(organization.featureFlags, feature)
  if (!hasFeature) throw new Error(`Feature "${feature}" is not enabled for this organization`)
  return true
}
