import { useOutlet } from "react-router-dom"
import type { User } from "@/common/features/me/me.models"
import { DotsBackground } from "@/components/DotsBackground"
import { SidebarBreadcrumb } from "@/components/layouts/sidebar/SidebarBreadcrumb"
import { NavUserMenuItems } from "@/components/sidebar/nav/NavUserMenuItems"
import { Logo } from "@/components/themes/Logo"
import type { Organization } from "@/features/organizations/organizations.models"
import type { Project } from "@/features/projects/projects.models"
import { ProjectList } from "@/studio/features/projects/components/ProjectList"
import { NavUser } from "../components/NavUser"

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
  return (
    <div className="min-h-screen flex flex-col">
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

      <DotsBackground className="flex-1">
        <div className="mx-6 xl:max-w-2/3 xl:min-w-2/3 xl:mx-auto mt-30 mb-6 flex flex-col z-0 relative border border-foreground-muted">
          {outlet ? (
            outlet
          ) : (
            <ProjectList projects={projects} organization={organization} userName={user.name} />
          )}
        </div>
      </DotsBackground>
    </div>
  )
}
