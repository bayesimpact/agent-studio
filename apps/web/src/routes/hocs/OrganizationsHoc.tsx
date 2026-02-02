import { Navigate } from "react-router-dom"
import type { Organization } from "@/features/organizations/organizations.models"
import {
  selectCurrentOrganization,
  selectOrganizationsData,
} from "@/features/organizations/organizations.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { useSetCurrentOrganizationId } from "@/hooks/use-set-current-id"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function OrganizationsHoc({
  children,
}: {
  children: (organization: Organization) => React.ReactNode
}) {
  useSetCurrentOrganizationId()
  const { getPath } = useBuildPath()

  const organization = useAppSelector(selectCurrentOrganization)
  const data = useAppSelector(selectOrganizationsData)

  if (ADS.isError(data) || !organization) return <NotFoundRoute />

  if (ADS.isFulfilled(data) && organization) {
    if (data.value.length === 0) {
      return <Navigate to={getPath("onboarding")} replace />
    } else return <>{children(organization)}</>
  }

  return <LoadingRoute />
}
