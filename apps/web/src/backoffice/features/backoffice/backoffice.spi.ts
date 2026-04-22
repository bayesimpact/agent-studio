import type { FeatureFlagKey } from "@caseai-connect/api-contracts"
import type { BackofficeOrganization, BackofficeUser } from "./backoffice.models"

export interface IBackofficeSpi {
  listOrganizations: () => Promise<BackofficeOrganization[]>
  listUsers: () => Promise<BackofficeUser[]>
  addFeatureFlag: (params: { projectId: string; featureFlagKey: FeatureFlagKey }) => Promise<void>
  removeFeatureFlag: (params: {
    projectId: string
    featureFlagKey: FeatureFlagKey
  }) => Promise<void>
}
