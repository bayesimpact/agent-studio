import type { ProjectDto } from "@caseai-connect/api-contracts"
import { Header } from "@caseai-connect/ui/components/layouts/sidebar/Header"
import type { User } from "@caseai-connect/ui/components/layouts/sidebar/types"
import { Outlet } from "react-router-dom"
import { selectCurrentOrganizationName } from "@/features/organizations/organizations.selectors"
import { RouteNames } from "@/routes/helpers"
import { useAppSelector } from "@/store/hooks"
import { SidebarLayout } from "./layouts/SidebarLayout"
import { NavProjects } from "./sidebar/NavProjects"

export function DashboardLayout({
  user,
  projects,
  organizationId,
}: {
  user: User
  projects: ProjectDto[]
  organizationId?: string
}) {
  const organizationName = useAppSelector(selectCurrentOrganizationName(organizationId)) || "CaseAi"

  if (organizationId)
    return (
      <SidebarLayout
        sidebarHeaderChildren={<Header to={RouteNames.HOME} name={organizationName} />}
        sidebarContentChildren={<NavProjects projects={projects} organizationId={organizationId} />}
        user={user}
      >
        <Outlet />
      </SidebarLayout>
    )
  return <Outlet />
}
