import type { ProjectDto } from "@caseai-connect/api-contracts"
import { Header } from "@caseai-connect/ui/components/layouts/sidebar/Header"
import { SidebarMenu, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { Switch } from "@caseai-connect/ui/shad/switch"
import { delay } from "lodash"
import { SlidersHorizontalIcon, SparklesIcon } from "lucide-react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { authActions } from "@/features/auth/auth.slice"
import type { User } from "@/features/me/me.models"
import type { Organization } from "@/features/organizations/organizations.models"
import { useAbility } from "@/hooks/use-ability"
import { useBuildPath } from "@/hooks/use-build-path"
import { useAppDispatch } from "@/store/hooks"
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
  const { isAdmin, isAdminInterface } = useAbility()
  const organizationName = organization?.name || "CaseAi"
  const { getPath } = useBuildPath()

  if (organization)
    return (
      <SidebarLayout
        sidebarHeaderChildren={
          <div className="flex items-center gap-1">
            <Header
              Icon={isAdminInterface ? SlidersHorizontalIcon : SparklesIcon}
              to={getPath("organization")}
              name={organizationName}
              subname={isAdminInterface ? "Admin" : undefined}
              iconClassName={
                isAdminInterface
                  ? "bg-orange-500"
                  : "bg-gradient-to-tr from-purple-600 to-indigo-600"
              }
            />
            <InterfaceToggle isAdmin={isAdmin} isAdminInterface={isAdminInterface} />
          </div>
        }
        sidebarContentChildren={
          isAdminInterface ? (
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

function InterfaceToggle({
  isAdmin,
  isAdminInterface,
}: {
  isAdmin: boolean
  isAdminInterface: boolean
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  if (!isAdmin) return null

  const handleChange = (checked: boolean) => {
    dispatch(authActions.setIsAdminInterface(checked))
    const newLocation = location.pathname.replace(
      checked ? "/app" : "/admin",
      checked ? "/admin" : "/app",
    )
    delay(() => {
      navigate(newLocation)
    }, 300)
  }
  return <Switch checked={isAdminInterface} onCheckedChange={handleChange} />
}
