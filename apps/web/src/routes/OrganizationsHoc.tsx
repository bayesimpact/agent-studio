import { useNavigate } from "react-router-dom"
import type { Organization } from "@/features/organizations/organizations.models"
import { selectOrganizations } from "@/features/organizations/organizations.selectors"
import { useAppSelector } from "@/store/hooks"

export function OrganizationsHoc({
  children,
}: {
  children: (organizations: Organization[]) => React.ReactNode
}) {
  const navigate = useNavigate()
  const organizations = useAppSelector(selectOrganizations)

  if (organizations.length === 0) {
    navigate("/onboarding", { replace: true })
  }
  return <>{children(organizations)}</>
}
