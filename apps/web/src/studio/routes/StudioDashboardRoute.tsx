import { Button } from "@caseai-connect/ui/shad/button"
import { ExternalLinkIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useOutlet } from "react-router-dom"
import { SidebarAgentList } from "@/common/components/sidebar/list/SidebarAgentList"
import { NavUserMenuItems } from "@/common/components/sidebar/nav/NavUserMenuItems"
import { SidebarBreadcrumb } from "@/common/components/sidebar/SidebarBreadcrumb"
import { SidebarLayout } from "@/common/components/sidebar/SidebarLayout"
import type { User } from "@/common/features/me/me.models"
import type { Organization } from "@/common/features/organizations/organizations.models"
import { ProjectList } from "@/common/features/projects/components/ProjectList"
import { useAppSelector } from "@/common/store/hooks"
import { Logo } from "@/components/themes/Logo"
import { buildDeskPath } from "@/desk/routes/helpers"
import { SidebarAgentCreatorButton } from "@/features/agents/components/AgentCreator"
import type { Project } from "@/features/projects/projects.models"
import { selectCurrentProjectData } from "@/features/projects/projects.selectors"
import { DotsBackground } from "@/studio/components/DotsBackground"
import { NavUser } from "../components/NavUser"
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

export function StudioDashboardRoute2({
  user,
  projects,
  organization,
}: {
  user: User
  projects: Project[]
  organization: Organization
}) {
  const outlet = useOutlet()
  return (
    <div className="min-h-screen flex flex-col">
      <StudioHeader organization={organization} user={user} />

      <DotsBackground className="flex-1">
        <div className="mx-6 xl:max-w-2/3 xl:min-w-2/3 xl:mx-auto mt-24 xl:mt-30 mb-6 flex flex-col z-0 relative border border-foreground-muted">
          {outlet ? outlet : <ProjectList projects={projects} organization={organization} />}
        </div>
      </DotsBackground>
    </div>
  )
}

function StudioHeader({ organization, user }: { organization: Organization; user: User }) {
  const { t } = useTranslation()
  return (
    <header className="px-6 py-4 flex items-center flex-1 gap-2 border-b border-foreground-muted fixed top-0 left-0 right-0 bg-background z-10">
      <div className="size-10 contain-content p-1">
        <Logo />
      </div>
      <span className="text-2xl font-medium text-primary capitalize-first mr-6 select-none">
        Studio
      </span>

      <div className="flex-1">
        <SidebarBreadcrumb organization={organization} />
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={buildDeskPath(`/o/${organization.id}`)}
          >
            <ExternalLinkIcon />
            {t("actions:goToApp")}
          </a>
        </Button>
        <NavUser user={user}>
          <NavUserMenuItems />
        </NavUser>
      </div>
    </header>
  )
}
