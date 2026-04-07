import type { User } from "@/common/features/me/me.models"
import { selectMe } from "@/common/features/me/me.selectors"
import { useAppSelector } from "@/common/store/hooks"
import type { Organization } from "@/features/organizations/organizations.models"
import { selectCurrentOrganization } from "@/features/organizations/organizations.selectors"
import type { Project } from "@/features/projects/projects.models"
import { selectProjectsData } from "@/features/projects/projects.selectors"
import { AsyncRoute } from "./AsyncRoute"

export function DashboardRoute({
  children,
}: {
  children: (user: User, projects: Project[], organization: Organization) => React.ReactNode
}) {
  const user = useAppSelector(selectMe)
  const projects = useAppSelector(selectProjectsData)
  const organization = useAppSelector(selectCurrentOrganization)

  return (
    <AsyncRoute data={[user, projects, organization]}>
      {([userValue, projectsValue, organizationValue]) =>
        children(userValue, projectsValue, organizationValue)
      }
    </AsyncRoute>
  )
}
