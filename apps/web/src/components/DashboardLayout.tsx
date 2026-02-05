import { Header } from "@caseai-connect/ui/components/layouts/sidebar/Header"
import { SidebarMenu, SidebarMenuItem } from "@caseai-connect/ui/shad/sidebar"
import { Switch } from "@caseai-connect/ui/shad/switch"
import { SlidersHorizontalIcon, SparklesIcon } from "lucide-react"
import { useOutlet } from "react-router-dom"
import { authActions } from "@/features/auth/auth.slice"
import type { User } from "@/features/me/me.models"
import type { Organization } from "@/features/organizations/organizations.models"
import type { Project } from "@/features/projects/projects.models"
import { uploadResource } from "@/features/resources/resources.thunks"
import { useAbility } from "@/hooks/use-ability"
import { useGetPath } from "@/hooks/use-build-path"
import { useAppDispatch } from "@/store/hooks"
import { Uploader } from "./FileUploader"
import { SidebarLayout } from "./layouts/SidebarLayout"
import { AdminNavProjects, AppNavProjects } from "./sidebar/NavProjects"
import { CreateProjectDialogWithTrigger } from "./sidebar/projects/CreateProjectDialog"

export function DashboardLayout({
  user,
  projects,
  organization,
}: {
  user: User
  projects: Project[]
  organization: Organization
}) {
  const outlet = useOutlet()
  const { isAdmin, isAdminInterface } = useAbility()
  const organizationName = organization?.name || "CaseAi"
  const { getPath } = useGetPath()

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
              isAdminInterface ? "bg-orange-500" : "bg-gradient-to-tr from-purple-600 to-indigo-600"
            }
          />
          <InterfaceToggle isAdmin={isAdmin} isAdminInterface={isAdminInterface} />
        </div>
      }
      sidebarContentChildren={
        isAdminInterface ? (
          <>
            <AdminNavProjects organizationId={organization.id} projects={projects} />

            <SidebarMenu>
              <SidebarMenuItem>
                <CreateProjectDialogWithTrigger organization={organization} />
              </SidebarMenuItem>
            </SidebarMenu>
          </>
        ) : (
          <AppNavProjects organizationId={organization.id} projects={projects} />
        )
      }
      user={{
        name: user.name,
        email: user.email,
      }}
    >
      {outlet ? (
        outlet
      ) : (
        <MiddleContent organizationId={organization.id} projectId={projects[0]?.id || ""} />
      )}
    </SidebarLayout>
  )
}

function MiddleContent({
  organizationId,
  projectId,
}: {
  organizationId: string
  projectId: string
}) {
  const dispatch = useAppDispatch()
  const onSuccess = (params: { projectId: string; resourceId: string }) => {
    console.warn("AJ: onSuccess", params)
  }
  const handleProcessFile = async ({ file }: { file: File }) => {
    dispatch(uploadResource({ organizationId, projectId, file, onSuccess }))
  }
  return (
    <div>
      TODO: Admin Dashboard
      <Uploader
        organizationId={organizationId}
        projectId={projectId}
        processFile={handleProcessFile}
      />
    </div>
  )
}

function InterfaceToggle({
  isAdmin,
  isAdminInterface,
}: {
  isAdmin: boolean
  isAdminInterface: boolean
}) {
  const dispatch = useAppDispatch()
  const { getPath } = useGetPath()

  if (!isAdmin) return null

  const handleChange = (checked: boolean) => {
    dispatch(authActions.setIsAdminInterface(checked))
    const newLocation = getPath("project").replace(
      checked ? "/app" : "/admin",
      checked ? "/admin" : "/app",
    )
    window.location.replace(newLocation)
  }
  return <Switch checked={isAdminInterface} onCheckedChange={handleChange} />
}
