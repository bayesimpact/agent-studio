import type { FeatureFlagKey } from "@caseai-connect/api-contracts"
import { selectCurrentOrganization } from "@/features/organizations/organizations.selectors"
import type { RootState } from "@/store"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"

function check(flags: FeatureFlagKey[], feature: FeatureFlagKey): boolean {
  return flags.some((flag) => flag === feature)
}

export function useFeatureFlags() {
  const org = useAppSelector(selectCurrentOrganization)
  if (!ADS.isFulfilled(org)) return { hasFeature: () => false }
  return {
    hasFeature: (feature: FeatureFlagKey): boolean => check(org.value.featureFlags || [], feature),
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
  if (!ADS.isFulfilled(organization)) throw new Error("No organization selected")
  const hasFeature = check(organization.value.featureFlags, feature)
  if (!hasFeature) throw new Error(`Feature "${feature}" is not enabled for this organization`)
  return true
}
