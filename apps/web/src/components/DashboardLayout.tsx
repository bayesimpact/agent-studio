import type { ProjectDto } from "@caseai-connect/api-contracts"
import { Header } from "@caseai-connect/ui/components/layouts/sidebar/Header"
import { SidebarMenu, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { SlidersHorizontalIcon, SparklesIcon } from "lucide-react"
import { Outlet } from "react-router-dom"
import type { User } from "@/features/me/me.models"
import { selectCurrentOrganization } from "@/features/organizations/organizations.selectors"
import { useAbility } from "@/hooks/use-ability"
import { useBuildPath } from "@/hooks/use-build-path"
import { useAppSelector } from "@/store/hooks"
import { SidebarLayout } from "./layouts/SidebarLayout"
import { AdminNavProjects, AppNavProjects } from "./sidebar/NavProjects"
import { CreateProjectDialogWithTrigger } from "./sidebar/projects/CreateProjectDialog"

export function DashboardLayout({ user, projects }: { user: User; projects: ProjectDto[] }) {
  const { admin } = useAbility()
  const organization = useAppSelector(selectCurrentOrganization)
  const organizationName = organization?.name || "CaseAi"
  const { organizationPath } = useBuildPath()

  if (organization)
    return (
      <SidebarLayout
        sidebarHeaderChildren={
          <Header
            Icon={admin ? SlidersHorizontalIcon : SparklesIcon}
            to={organizationPath}
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
