import type { FeatureFlagKey } from "@caseai-connect/api-contracts"
import type { RootState } from "@/common/store"
import { ADS } from "@/common/store/async-data-status"
import { useAppSelector } from "@/common/store/hooks"
import { selectCurrentProjectData } from "@/features/projects/projects.selectors"

function check(flags: FeatureFlagKey[], feature: FeatureFlagKey): boolean {
  return flags.some((flag) => flag === feature)
}

export function useFeatureFlags() {
  const project = useAppSelector(selectCurrentProjectData)
  if (!ADS.isFulfilled(project)) return { hasFeature: () => false }
  return {
    hasFeature: (feature: FeatureFlagKey): boolean =>
      check(project.value.featureFlags || [], feature),
  }
}

export type HasFeature = (feature: FeatureFlagKey) => boolean

export function hasFeatureOrThrow({
  state,
  feature,
}: {
  state: RootState
  feature: FeatureFlagKey
}): true {
  const project = selectCurrentProjectData(state)
  if (!ADS.isFulfilled(project)) throw new Error("No project selected")
  const hasFeature = check(project.value.featureFlags, feature)
  if (!hasFeature) throw new Error(`Feature "${feature}" is not enabled for this project`)
  return true
}
