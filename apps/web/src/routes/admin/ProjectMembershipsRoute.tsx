import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useSidebarLayout } from "@/components/layouts/sidebar/context"
import { InviteProjectMembersDialog } from "@/components/project-memberships/InviteProjectMembersDialog"
import { ProjectMembershipsList } from "@/components/project-memberships/ProjectMembershipsList"
import { selectCurrentOrganizationId } from "@/features/organizations/organizations.selectors"
import type { ProjectMembership } from "@/features/project-memberships/project-memberships.models"
import { selectProjectMemberships } from "@/features/project-memberships/project-memberships.selectors"
import { listProjectMemberships } from "@/features/project-memberships/project-memberships.thunks"
import type { Project } from "@/features/projects/projects.models"
import { selectCurrentProjectId, selectProjectData } from "@/features/projects/projects.selectors"
import { useAbility } from "@/hooks/use-ability"
import { ADS } from "@/store/async-data-status"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { LoadingRoute } from "../LoadingRoute"
import { NotFoundRoute } from "../NotFoundRoute"

export function ProjectMembershipsRoute() {
  const dispatch = useAppDispatch()
  const projectId = useAppSelector(selectCurrentProjectId)
  const organizationId = useAppSelector(selectCurrentOrganizationId)
  const project = useAppSelector(selectProjectData)
  const membershipsData = useAppSelector(selectProjectMemberships)

  useEffect(() => {
    if (organizationId && projectId) {
      dispatch(listProjectMemberships({ organizationId, projectId }))
    }
  }, [dispatch, organizationId, projectId])

  if (!projectId || !organizationId) return <NotFoundRoute />
  if (ADS.isError(membershipsData) || ADS.isError(project)) return <NotFoundRoute />

  if (ADS.isFulfilled(membershipsData) && ADS.isFulfilled(project))
    return (
      <WithData
        project={project.value}
        memberships={membershipsData.value}
        organizationId={organizationId}
      />
    )

  return <LoadingRoute />
}

function WithData({
  memberships,
  project,
  organizationId,
}: {
  memberships: ProjectMembership[]
  project: Project
  organizationId: string
}) {
  useHandleHeader({ project, organizationId })
  return (
    <div className="p-6">
      <ProjectMembershipsList
        memberships={memberships}
        organizationId={organizationId}
        projectId={project.id}
      />
    </div>
  )
}

function useHandleHeader({
  project,
  organizationId,
}: {
  project: Project
  organizationId: string
}) {
  const { t } = useTranslation("projectMemberships", { keyPrefix: "header" })
  const { isAdminInterface } = useAbility()
  const { setHeaderTitle, setHeaderRightSlot } = useSidebarLayout()
  const headerTitle = t("title", { projectName: project.name })

  useEffect(() => {
    setHeaderTitle(headerTitle)
    if (isAdminInterface)
      setHeaderRightSlot(
        <InviteProjectMembersDialog organizationId={organizationId} projectId={project.id} />,
      )
    return () => {
      setHeaderTitle("")
      setHeaderRightSlot(undefined)
    }
  }, [headerTitle, setHeaderTitle, setHeaderRightSlot, isAdminInterface, project, organizationId])
}
