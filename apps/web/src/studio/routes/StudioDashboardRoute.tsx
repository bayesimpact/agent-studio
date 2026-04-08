import { Outlet, useOutlet } from "react-router-dom"
import type { User } from "@/common/features/me/me.models"
import { ADS } from "@/common/store/async-data-status"
import { useAppSelector } from "@/common/store/hooks"
import { Logo } from "@/components/themes/Logo"
import { SidebarAgentList } from "@/desk/components/sidebar/list/SidebarAgentList"
import { NavUserMenuItems } from "@/desk/components/sidebar/nav/NavUserMenuItems"
import { SidebarBreadcrumb } from "@/desk/components/sidebar/SidebarBreadcrumb"
import { SidebarLayout } from "@/desk/components/sidebar/SidebarLayout"
import type { Organization } from "@/features/organizations/organizations.models"
import type { Project } from "@/features/projects/projects.models"
import { selectCurrentProjectData } from "@/features/projects/projects.selectors"
import { DotsBackground } from "@/studio/components/DotsBackground"
import { ProjectList, ProjectList2 } from "@/studio/features/projects/components/ProjectList"
import { NavUser } from "../components/NavUser"
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
  const project = useAppSelector(selectCurrentProjectData)

  if (ADS.isFulfilled(project))
    return (
      <SidebarLayout
        organization={organization}
        sidebarContentChildren={
          <SidebarAgentList organizationId={organization.id} project={project.value} />
        }
        user={{ name: user.name, email: user.email }}
        sidebarFooterChildren={<SidebarFooterChildren project={project.value} />}
      >
        <DotsBackground className="flex-1">
          <div className="mx-10 2xl:mx-30 my-10 border relative">
            <Outlet />
          </div>
        </DotsBackground>
      </SidebarLayout>
    )

  return (
    <div>
      <StudioHeader organization={organization} user={user} />

      <ProjectList projects={projects} organization={organization} />
    </div>
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
          {outlet ? (
            outlet
          ) : (
            <ProjectList2 projects={projects} organization={organization} userName={user.name} />
          )}
        </div>
      </DotsBackground>
    </div>
  )
}

function StudioHeader({ organization, user }: { organization: Organization; user: User }) {
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
        <NavUser user={user}>
          <NavUserMenuItems />
        </NavUser>
      </div>
    </header>
  )
}
