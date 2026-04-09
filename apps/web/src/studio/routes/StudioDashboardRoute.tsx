import { useOutlet } from "react-router-dom"
import { SidebarAgentList } from "@/common/components/sidebar/list/SidebarAgentList"
import { SidebarLayout } from "@/common/components/sidebar/SidebarLayout"
import type { User } from "@/common/features/me/me.models"
import type { Organization } from "@/common/features/organizations/organizations.models"
import { ProjectList } from "@/common/features/projects/components/ProjectList"
import type { Project } from "@/common/features/projects/projects.models"
import { selectCurrentProjectData } from "@/common/features/projects/projects.selectors"
import { useAppSelector } from "@/common/store/hooks"
import { DotsBackground } from "@/studio/components/DotsBackground"
import { SidebarAgentCreatorButton } from "@/studio/features/agents/components/AgentCreator"
import { ProjectCreatorButton } from "../features/projects/components/ProjectCreator"
import { SidebarFooterChildren } from "./SidebarFooterChildren"

export function StudioDashboardRoute({
  user,
  projects,
  organization,
}: {
  user: User
  projects: Project[]
  organization: Organization
}) {
  const outlet = useOutlet()
  const project = useAppSelector(selectCurrentProjectData)

  return (
    <SidebarLayout
      organization={organization}
      sidebarContentChildren={
        <SidebarAgentList
          organizationId={organization.id}
          project={project.value}
          action={project.value && <SidebarAgentCreatorButton project={project.value} />}
        />
      }
      user={{ name: user.name, email: user.email }}
      sidebarFooterChildren={project.value && <SidebarFooterChildren project={project.value} />}
    >
      <DotsBackground className="flex-1">
        <div className="mx-10 2xl:mx-30 my-10 border relative rounded-2xl overflow-hidden">
          {outlet ? (
            outlet
          ) : (
            <ProjectList projects={projects} organization={organization}>
              <ProjectCreatorButton index={projects.length} organization={organization} />
            </ProjectList>
          )}
        </div>
      </DotsBackground>
    </SidebarLayout>
  )
}
