import { Header } from "@caseai-connect/ui/components/layouts/sidebar/Header"
import { Switch } from "@caseai-connect/ui/shad/switch"
import { SlidersHorizontalIcon, SparklesIcon } from "lucide-react"
import { Outlet, useParams } from "react-router-dom"
import { SidebarLayout } from "@/components/layouts/SidebarLayout"
import { ProjectList } from "@/components/ProjectList"
import { NavDocuments } from "@/components/sidebar/nav/NavDocuments"
import { NavEvaluation } from "@/components/sidebar/nav/NavEvaluation"
import { AdminNavProject, AppNavProject } from "@/components/sidebar/nav/NavProject"
import { NavProjectMemberships } from "@/components/sidebar/nav/NavProjectMemberships"
import { Logo } from "@/components/themes/Logo"
import { authActions } from "@/features/auth/auth.slice"
import type { User } from "@/features/me/me.models"
import { selectMeData } from "@/features/me/me.selectors"
import type { Organization } from "@/features/organizations/organizations.models"
import { selectOrganizationsData } from "@/features/organizations/organizations.selectors"
import type { Project } from "@/features/projects/projects.models"
import {
  selectCurrentProjectData,
  selectProjectsData,
} from "@/features/projects/projects.selectors"
import { useAbility } from "@/hooks/use-ability"
import { useGetPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { ErrorRoute } from "./ErrorRoute"
import { LoadingRoute } from "./LoadingRoute"
import { setCurrentIds } from "./loaders/set-current-ids"

export function DashboardRoute() {
  const user = useAppSelector(selectMeData)
  const organizations = useAppSelector(selectOrganizationsData)
  const projects = useAppSelector(selectProjectsData)

  if (ADS.isError(user) || ADS.isError(organizations) || ADS.isError(projects))
    return (
      <ErrorRoute error={user.error || organizations.error || projects.error || "Unknown error"} />
    )

  if (ADS.isFulfilled(user) && ADS.isFulfilled(organizations) && ADS.isFulfilled(projects)) {
    return (
      <WithData user={user.value} projects={projects.value} organizations={organizations.value} />
    )
  }

  return <LoadingRoute />
}

function WithData({
  user,
  projects,
  organizations,
}: {
  user: User
  projects: Project[]
  organizations: Organization[]
}) {
  const dispatch = useAppDispatch()
  const params = useParams()
  setCurrentIds({ dispatch, params })

  const { isAdmin, isAdminInterface } = useAbility()
  const project = useAppSelector(selectCurrentProjectData)

  const organization = organizations[0]

  if (!organization) return <ErrorRoute error="Missing valid organization" />

  const organizationName = organization?.name || "CaseAi"

  const projectList = (
    <ProjectList
      isAdminInterface={isAdminInterface}
      projects={projects}
      organization={organization}
    />
  )

  if (ADS.isFulfilled(project))
    return (
      <SidebarLayout
        organization={organization}
        sidebarHeaderChildren={
          <SidebarHeader
            isAdminInterface={isAdminInterface}
            isAdmin={isAdmin}
            organizationName={organizationName}
          />
        }
        sidebarContentChildren={
          <SidebarContent
            isAdminInterface={isAdminInterface}
            project={project.value}
            organization={organization}
          />
        }
        sidebarFooterChildren={isAdminInterface ? <SidebarFooter project={project.value} /> : null}
        user={{
          name: user.name,
          email: user.email,
        }}
      >
        <Outlet />
      </SidebarLayout>
    )

  return projectList
}

function SidebarHeader({
  isAdminInterface,
  isAdmin,
  organizationName,
}: {
  isAdminInterface: boolean
  isAdmin: boolean
  organizationName: string
}) {
  const { getPath } = useGetPath()
  return (
    <div className="flex items-center gap-1">
      <Header
        Icon={isAdminInterface ? SlidersHorizontalIcon : SparklesIcon}
        to={getPath("organization")}
        name={organizationName}
        subname={isAdminInterface ? "Admin" : undefined}
        subnameClassName="text-primary"
      >
        <div className="size-10 contain-content p-1">
          <Logo />
        </div>
      </Header>
      <InterfaceToggle isAdmin={isAdmin} isAdminInterface={isAdminInterface} />
    </div>
  )
}

export function InterfaceToggle({
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

function SidebarContent({
  isAdminInterface,
  project,
  organization,
}: {
  isAdminInterface: boolean
  project: Project
  organization: Organization
}) {
  if (isAdminInterface)
    return <AdminNavProject organizationId={organization.id} project={project} />
  return <AppNavProject organizationId={organization.id} project={project} />
}

function SidebarFooter({ project }: { project: Project }) {
  return (
    <>
      <NavEvaluation organizationId={project.organizationId} projectId={project.id} />
      <NavDocuments organizationId={project.organizationId} projectId={project.id} />
      <NavProjectMemberships organizationId={project.organizationId} projectId={project.id} />
    </>
  )
}
