import { Outlet } from "react-router-dom"
import { SidebarLayout } from "@/components/layouts/SidebarLayout"
import { ProjectList } from "@/components/ProjectList"
import { SidebarAgentList } from "@/components/sidebar/list/SidebarAgentList"
import type { User } from "@/features/me/me.models"
import type { Organization } from "@/features/organizations/organizations.models"
import type { Project } from "@/features/projects/projects.models"
import { selectCurrentProjectData } from "@/features/projects/projects.selectors"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"

export function DeskDashboardRoute({
  user,
  projects,
  organization,
}: {
  user: User
  projects: Project[]
  organization: Organization
}) {
  const project = useAppSelector(selectCurrentProjectData)

  if (ADS.isFulfilled(project))
    return (
      <SidebarLayout
        organization={organization}
        sidebarContentChildren={
          <SidebarAgentList organizationId={organization.id} project={project.value} />
        }
        user={{ name: user.name, email: user.email }}
      >
        <Outlet />
      </SidebarLayout>
    )

  return <ProjectList projects={projects} organization={organization} />
}
