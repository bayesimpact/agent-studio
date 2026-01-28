import { useNavigate } from "react-router-dom"
import {
  selectCurrentOrganizationId,
  selectOrganizations,
  selectOrganizationsStatus,
} from "@/features/organizations/organizations.selectors"
import { useSetCurrentOrganizationId } from "@/hooks/use-set-current-id"
import { useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "./LoadingRoute"
import { NotFoundRoute } from "./NotFoundRoute"

export function OrganizationsLoader({
  children,
}: {
  children: (organizationId: string) => React.ReactNode
}) {
  useSetCurrentOrganizationId()

  const navigate = useNavigate()
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const status = useAppSelector(selectOrganizationsStatus)
  const organizations = useAppSelector(selectOrganizations)

  if (status === "failed") return <NotFoundRoute />

  if (status === "succeeded" && organizationId) {
    if (organizations.length === 0) {
      navigate("/onboarding", { replace: true })
    }
    return <>{children(organizationId)}</>
  }

  return <LoadingRoute />
}
