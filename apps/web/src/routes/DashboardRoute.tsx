import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@caseai-connect/ui/shad/sidebar"
import { useTranslation } from "react-i18next"
import { Outlet } from "react-router-dom"
import { SidebarLayout } from "@/components/layouts/SidebarLayout"
import { ProjectList } from "@/components/ProjectList"
import { RestrictedFeature } from "@/components/RestrictedFeature"
import { SidebarAgentList } from "@/components/sidebar/list/SidebarAgentList"
import { NavDocuments } from "@/components/sidebar/nav/NavDocuments"
import { NavEvaluation } from "@/components/sidebar/nav/NavEvaluation"
import { NavProjectMemberships } from "@/components/sidebar/nav/NavProjectMemberships"
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
import { AsyncRoute } from "./AsyncRoute"

export function DashboardRoute() {
  const user = useAppSelector(selectMe)
  const projects = useAppSelector(selectProjectsData)
  const organization = useAppSelector(selectCurrentOrganization)

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
          <SidebarAgentList
            organizationId={organization.id}
            project={project.value}
            isAdminInterface={isAdminInterface}
          />
        }
        sidebarFooterChildren={
          isAdminInterface && <SidebarFooterChildren project={project.value} />
        }
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

function SidebarFooterChildren({ project }: { project: Project }) {
  const { t } = useTranslation()
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex-col items-start mb-3">
        <span className="font-bold text-sm">{project.name}</span>
        <span className="uppercase">{t("project:settings")}</span>
      </SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu>
          <RestrictedFeature feature="evaluation">
            <NavEvaluation organizationId={project.organizationId} projectId={project.id} />
          </RestrictedFeature>

          <NavDocuments organizationId={project.organizationId} projectId={project.id} />

          <NavProjectMemberships organizationId={project.organizationId} projectId={project.id} />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
