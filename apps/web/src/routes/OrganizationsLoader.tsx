import { Navigate } from "react-router-dom"
import {
  selectCurrentOrganizationId,
  selectOrganizationsData,
} from "@/features/organizations/organizations.selectors"
import { useSetCurrentOrganizationId } from "@/hooks/use-set-current-id"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { buildAdminPath, RouteNames } from "./helpers"
import { LoadingRoute } from "./LoadingRoute"
import { NotFoundRoute } from "./NotFoundRoute"

export function OrganizationsLoader({
  children,
}: {
  children: (organizationId: string) => React.ReactNode
}) {
  useSetCurrentOrganizationId()

  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const organizationsData = useAppSelector(selectOrganizationsData)

  if (ADS.isError(organizationsData)) return <NotFoundRoute />

  if (ADS.isFulfilled(organizationsData) && organizationId) {
    if (organizationsData.value.length === 0) {
      return <Navigate to={buildAdminPath(RouteNames.ONBOARDING)} replace />
    } else return <>{children(organizationId)}</>
  }

  return <LoadingRoute />
}
