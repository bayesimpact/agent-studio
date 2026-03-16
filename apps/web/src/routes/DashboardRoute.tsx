import { Outlet } from "react-router-dom"
import { SidebarLayout } from "@/components/layouts/SidebarLayout"
import { SidebarContent } from "@/components/layouts/sidebar/SidebarContent"
import { SidebarFooter } from "@/components/layouts/sidebar/SidebarFooter"
import { ProjectList } from "@/components/ProjectList"
import type { User } from "@/features/me/me.models"
import { selectMe } from "@/features/me/me.selectors"
import type { Organization } from "@/features/organizations/organizations.models"
import { selectCurrentOrganization } from "@/features/organizations/organizations.selectors"
import type { Project } from "@/features/projects/projects.models"
import {
  selectCurrentProjectData,
  selectProjectsData,
} from "@/features/projects/projects.selectors"
import { useAbility } from "@/hooks/use-ability"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { useSetCurrentIds } from "../hooks/use-set-current-ids"
import { useSetIsAdminInterface } from "../hooks/use-set-is-admin-interface"
import { AsyncRoute } from "./AsyncRoute"

export function DashboardRoute() {
  const user = useAppSelector(selectMe)
  const projects = useAppSelector(selectProjectsData)
  const organization = useAppSelector(selectCurrentOrganization)

  useSetCurrentIds()
  useSetIsAdminInterface()

  return (
    <AsyncRoute data={[user, projects, organization]}>
      {([userValue, projectsValue, organizationValue]) => (
        <WithData user={userValue} projects={projectsValue} organization={organizationValue} />
      )}
    </AsyncRoute>
  )
}

function WithData({
  user,
  projects,
  organization,
}: {
  user: User
  projects: Project[]
  organization: Organization
}) {
  const { isAdminInterface } = useAbility()
  const project = useAppSelector(selectCurrentProjectData)

  if (ADS.isFulfilled(project))
    return (
      <SidebarLayout
        organization={organization}
        sidebarContentChildren={
          <SidebarContent
            isAdminInterface={isAdminInterface}
            project={project.value}
            projects={projects}
            organization={organization}
          />
        }
        sidebarFooterChildren={isAdminInterface ? <SidebarFooter project={project.value} /> : null}
        user={{ name: user.name, email: user.email }}
      >
        <Outlet />
      </SidebarLayout>
    )

  return (
    <ProjectList
      isAdminInterface={isAdminInterface}
      projects={projects}
      organization={organization}
    />
  )
}
