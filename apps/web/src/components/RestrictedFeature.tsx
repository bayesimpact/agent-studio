import type { FeatureFlagKey } from "@caseai-connect/api-contracts"
import { useFeatureFlags } from "@/hooks/use-feature-falgs"

export function RestrictedFeature({
  feature,
  children,
}: {
  feature: FeatureFlagKey
  children: React.ReactNode
}) {
  const { hasFeature } = useFeatureFlags()
  if (!hasFeature(feature)) return null
  return <>{children}</>
}
