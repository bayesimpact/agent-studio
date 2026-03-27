import { useNavigate } from "react-router-dom"
import type { Organization } from "@/features/organizations/organizations.models"
import { ADS, type AsyncData } from "@/store/async-data-status"
import { useBuildPath } from "./use-build-path"

export function useNavigateToFirstOrganization() {
  const navigate = useNavigate()
  const { buildPath } = useBuildPath()

  const getPathForFirstOrganization = (organization: Organization): string => {
    const path = buildPath("organization", { organizationId: organization.id })
    return path
  }

  const navigateToFirstOrganization = ({
    organizations,
    onFail,
  }: {
    organizations: AsyncData<Organization[]>
    onFail?: () => void
  }) => {
    const firstOrganization = ADS.isFulfilled(organizations) && organizations.value[0]

    if (!firstOrganization) {
      onFail?.()
      return
    }

    const path = getPathForFirstOrganization(firstOrganization)
    navigate(path, { replace: true })
  }

  return { navigateToFirstOrganization }
}
