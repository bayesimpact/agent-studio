import type { ProjectDto } from "@caseai-connect/api-contracts"
import { Header } from "@caseai-connect/ui/components/layouts/sidebar/Header"
import { SidebarMenu, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { SlidersHorizontalIcon, SparklesIcon } from "lucide-react"
import { Outlet } from "react-router-dom"
import type { User } from "@/features/me/me.models"
import type { Organization } from "@/features/organizations/organizations.models"
import { useAbility } from "@/hooks/use-ability"
import { useBuildPath } from "@/hooks/use-build-path"
import { SidebarLayout } from "./layouts/SidebarLayout"
import { AdminNavProjects, AppNavProjects } from "./sidebar/NavProjects"
import { CreateProjectDialogWithTrigger } from "./sidebar/projects/CreateProjectDialog"

export function DashboardLayout({
  user,
  projects,
  organization,
}: {
  user: User
  projects: ProjectDto[]
  organization: Organization
}) {
  const { admin } = useAbility()
  const organizationName = organization?.name || "CaseAi"
  const { getPath } = useBuildPath()

  if (organization)
    return (
      <SidebarLayout
        sidebarHeaderChildren={
          <Header
            Icon={admin ? SlidersHorizontalIcon : SparklesIcon}
            to={getPath("organization")}
            name={organizationName}
            subname={admin ? "Admin" : undefined}
            iconClassName={
              admin ? "bg-orange-500" : "bg-gradient-to-tr from-purple-600 to-indigo-600"
            }
          />
        }
        sidebarContentChildren={
          admin ? (
            <>
              <AdminNavProjects projects={projects} />

              <SidebarMenu>
                <SidebarMenuItem>
                  <CreateProjectDialogWithTrigger organization={organization} />
                </SidebarMenuItem>
              </SidebarMenu>
            </>
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
