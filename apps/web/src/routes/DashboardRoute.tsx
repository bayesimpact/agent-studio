import { Header } from "@caseai-connect/ui/components/layouts/sidebar/Header"
import { SlidersHorizontalIcon, SparklesIcon } from "lucide-react"
import { useEffect } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import { SidebarLayout } from "@/components/layouts/SidebarLayout"
import { ProjectList } from "@/components/ProjectList"
import { RestrictedFeature } from "@/components/RestrictedFeature"
import { NavDocuments } from "@/components/sidebar/nav/NavDocuments"
import { NavEvaluation } from "@/components/sidebar/nav/NavEvaluation"
import { AdminNavProject, AppNavProject } from "@/components/sidebar/nav/NavProject"
import { NavProjectMemberships } from "@/components/sidebar/nav/NavProjectMemberships"
import { Logo } from "@/components/themes/Logo"
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
import { useGetPath } from "@/hooks/use-build-path"
import { ADS } from "@/store/async-data-status"
import { useAppSelector } from "@/store/hooks"
import { useSetCurrentIds } from "../hooks/use-set-current-ids"
import { useSetIsAdminInterface } from "../hooks/use-set-is-admin-interface"
import { AsyncRoute } from "./AsyncRoute"
import { buildStudioPath } from "./helpers"

export function DashboardRoute() {
  const user = useAppSelector(selectMe)
  const projects = useAppSelector(selectProjectsData)
  const organization = useAppSelector(selectCurrentOrganization)

  useSetCurrentIds()
  useSetIsAdminInterface()

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
  const { isAdmin, isAdminInterface } = useAbility()
  const navigate = useNavigate()
  const project = useAppSelector(selectCurrentProjectData)

  useEffect(() => {
    if (isAdmin && !isAdminInterface && projects.length === 0) {
      navigate(buildStudioPath(`/o/${organization.id}/`), { replace: true })
    }
  }, [isAdmin, isAdminInterface, projects.length, organization.id, navigate])

  if (ADS.isFulfilled(project))
    return (
      <SidebarLayout
        organization={organization}
        sidebarHeaderChildren={
          <SidebarHeader isAdminInterface={isAdminInterface} organizationName={organization.name} />
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

  return (
    <ProjectList
      isAdminInterface={isAdminInterface}
      projects={projects}
      organization={organization}
    />
  )
}

function SidebarHeader({
  isAdminInterface,
  organizationName,
}: {
  isAdminInterface: boolean
  organizationName: string
}) {
  const { getPath } = useGetPath()
  return (
    <div className="flex items-center gap-1">
      <Header
        Icon={isAdminInterface ? SlidersHorizontalIcon : SparklesIcon}
        to={getPath("organization")}
        name={organizationName}
        subname={isAdminInterface ? "Studio" : undefined}
        subnameClassName="text-primary"
      >
        <div className="size-10 contain-content p-1">
          <Logo />
        </div>
      </Header>
    </div>
  )
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
      <RestrictedFeature feature="evaluation">
        <NavEvaluation organizationId={project.organizationId} projectId={project.id} />
      </RestrictedFeature>
      <NavDocuments organizationId={project.organizationId} projectId={project.id} />
      <NavProjectMemberships organizationId={project.organizationId} projectId={project.id} />
    </>
  )
}
