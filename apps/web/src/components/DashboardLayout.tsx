import type { ProjectDto } from "@caseai-connect/api-contracts"
import { Header } from "@caseai-connect/ui/components/layouts/sidebar/Header"
import { Outlet } from "react-router-dom"
import type { User } from "@/features/me/me.models"
import { selectCurrentOrganization } from "@/features/organizations/organizations.selectors"
import { RouteNames } from "@/routes/helpers"
import { useAppSelector } from "@/store/hooks"
import { SidebarLayout } from "./layouts/SidebarLayout"
import { AdminNavProjects, AppNavProjects } from "./sidebar/NavProjects"

export function DashboardLayout({ user, projects }: { user: User; projects: ProjectDto[] }) {
  const organization = useAppSelector(selectCurrentOrganization)
  const organizationName = organization?.name || "CaseAi"

  if (organization)
    return (
      <SidebarLayout
        sidebarHeaderChildren={<Header to={RouteNames.HOME} name={organizationName} />}
        sidebarContentChildren={
          user.admin ? (
            <AdminNavProjects projects={projects} />
          ) : (
            <AppNavProjects projects={projects} />
          )
        }
        user={{
          name: user.name,
          email: user.email,
        }}
      >
        <Outlet />
      </SidebarLayout>
    )
  return <Outlet />
}
