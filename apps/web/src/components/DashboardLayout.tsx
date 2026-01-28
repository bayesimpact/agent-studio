import type { ProjectDto } from "@caseai-connect/api-contracts"
import { Header } from "@caseai-connect/ui/components/layouts/sidebar/Header"
import type { User } from "@caseai-connect/ui/components/layouts/sidebar/types"
import { Outlet } from "react-router-dom"
import { selectCurrentOrganization } from "@/features/organizations/organizations.selectors"
import { RouteNames } from "@/routes/helpers"
import { useAppSelector } from "@/store/hooks"
import { SidebarLayout } from "./layouts/SidebarLayout"
import { NavProjects } from "./sidebar/NavProjects"

export function DashboardLayout({ user, projects }: { user: User; projects: ProjectDto[] }) {
  const organization = useAppSelector(selectCurrentOrganization)
  const organizationName = organization?.name || "CaseAi"

  if (organization)
    return (
      <SidebarLayout
        sidebarHeaderChildren={<Header to={RouteNames.HOME} name={organizationName} />}
        sidebarContentChildren={<NavProjects projects={projects} />}
        user={user}
      >
        <Outlet />
      </SidebarLayout>
    )
  return <Outlet />
}
