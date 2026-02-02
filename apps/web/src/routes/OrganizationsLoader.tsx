import { Navigate } from "react-router-dom"
import {
  selectCurrentOrganization,
  selectOrganizationsData,
} from "@/features/organizations/organizations.selectors"
import { useBuildPath } from "@/hooks/use-build-path"
import { useSetCurrentOrganizationId } from "@/hooks/use-set-current-id"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"
import { NotFoundRoute } from "./NotFoundRoute"

export function OrganizationsLoader({
  children,
}: {
  children: (organizationId: string) => React.ReactNode
}) {
  useSetCurrentOrganizationId()
  const { getPath } = useBuildPath()

  const organization = useAppSelector(selectCurrentOrganization)
  const organizationsData = useAppSelector(selectOrganizationsData)

  if (ADS.isError(organizationsData) || !organization) return <NotFoundRoute />

  if (ADS.isFulfilled(organizationsData) && organization) {
    if (organizationsData.value.length === 0) {
      return <Navigate to={getPath("onboarding")} replace />
    } else return <>{children(organization.id)}</>
  }

  return <LoadingRoute />
}
